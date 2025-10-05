import { getNews } from "../actions/finnhub.actions";
import { getAllUsersForNewsEmail } from "../actions/user.actions";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.actions";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "../nodemailer";
import { formatDateToday } from "../utils";
import { inngest } from "./client";
import { NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT } from "./prompts";

export const sendSignUpEmail = inngest.createFunction(
  { id: 'sign-up-email' },
  { event: 'app/user.created' },
  async ({ event, step }) => {
    const userProfile = `
      - Country: ${event.data.country}
      - Investment goals: ${event.data.investmentGoals}
      - Risk tolerance: ${event.data.riskTolerance}
      - Preferred industry: ${event.data.preferredIndustry}
    `;


    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile);

    const response = await step.ai.infer('generate-welcome-intro', {
      model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite-preview-06-17' }), 
      body: {
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt }
            ]
          }
        ]
      }
    });

    await step.run('send-welcome-email', async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText = (part && 'text' in part ? part?.text : null) || 'Thanks for joining Signalist. You now have the tools to track markets and make smarter moves.'

      const { data: { email, name } } = event;
      return await sendWelcomeEmail({
        email,
        name,
        intro: introText
      })
    });

    return {
      success: true,
      message: 'Welcome email sent successfully'
    }
  }
)

export const sendDailyNewsSummary = inngest.createFunction(
  { id: 'daily-news-summary' },
  [
    { event: 'app/send.daily.news' },
    // everyday 12pm utc
    // Format: "min hr dayOfMonth month dayOfWeek"
    { cron: '0 0 * * *' }, 
  ],
  async ({ step }) => {
    // Step #1: Get all users for news delivery
    const users = await step.run('get-all-users', getAllUsersForNewsEmail);

    if (!users || users.length === 0) return {
      success: false,
      message: 'No users found for news email.'
    };

    // Step #2: Fetch personalized news for each user
    const results = await step.run('prepare-news-per-user', async () => {
      const perUser: Array<{ user: User; articles: MarketNewsArticle[] }> = [];

      for (const user of users) {
        try {
          const symbols = await getWatchlistSymbolsByEmail(user.email);
          let articles = await getNews(symbols);

          // Enforce max 6 articles per user
          articles = (articles || []).slice(0, 6);

          // If still empty, fallback to general
          if (!articles || articles.length === 0) {
            articles = await getNews();
            articles = (articles || []).slice(0, 6);
          }

          perUser.push({ user, articles });
        } catch (error) {
          console.error('daily-news: error preparing user news', user.email, error);
        }
      }

      return perUser;
    })

    // Step #3: Summarize news via AI for each user
    const userNewsSummaries: { user: User; newsContent: string | null }[] = [];
    
    for (const { user, articles } of results) {
      try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT
          .replace('{{newsData}}', JSON.stringify(articles, null, 2));

        const response = await step.ai.infer(`summarize-news-${user.email}`, {
          model: step.ai.models.gemini({ model: 'gemini-2.5-flash' }),
          body: {
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
          }
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const newsContent = (part && 'text' in part ? part.text : null) || 'No market news.';

        userNewsSummaries.push({ user, newsContent });
      } catch (error) {
        console.error('Failed to summarize news for ', user.email, ' : ', error);
        userNewsSummaries.push({ user: user, newsContent: null });
      }
    }

    // Step #4: Send emails
    await step.run('send-news-emails', async () => {
      await Promise.all(
        userNewsSummaries.map(async ({ user, newsContent }) => {
          if (!newsContent) return false;

          return await sendNewsSummaryEmail({
            email: user.email,
            date: formatDateToday,
            newsContent,
          })
        })
      )
    });

    return { success: true, message: 'Daily news summary emails sent successfully.' } as const;
  }
)