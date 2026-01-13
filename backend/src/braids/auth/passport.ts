import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { AuthService } from './service.js';

export function configurePassport() {
  // Only configure Google OAuth if credentials are provided
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL;

  if (googleClientId && googleClientSecret && googleCallbackUrl) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL: googleCallbackUrl,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            const name = profile.displayName;
            const picture = profile.photos?.[0]?.value;

            if (!email) {
              return done(new Error('No email found in Google profile'));
            }

            const authResponse = await AuthService.findOrCreateGoogleUser({
              id: profile.id,
              email,
              name,
              picture,
            });

            done(null, authResponse);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );
    console.log('✅ Google OAuth configured');
  } else {
    console.log('⚠️  Google OAuth not configured (missing credentials)');
  }
}
