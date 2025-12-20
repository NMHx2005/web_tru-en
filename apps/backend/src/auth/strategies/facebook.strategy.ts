import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService
  ) {
    super({
      clientID: configService.get<string>('FACEBOOK_APP_ID'),
      clientSecret: configService.get<string>('FACEBOOK_APP_SECRET'),
      callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL') || '/api/auth/facebook/callback',
      scope: 'email', // Request email permission
      profileFields: ['emails', 'name', 'picture', 'id'], // Include id for fallback
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void
  ): Promise<any> {
    const { id, name, emails, photos, username } = profile;

    // Handle case where email is not available
    // In production with App Review approved, email should be available
    // In development mode, email might not be available for all users
    let email = emails?.[0]?.value;
    let needsEmail = false;

    if (!email) {
      // Generate a placeholder email from Facebook ID
      // This ensures we can still create the user account
      // Frontend will prompt user to enter real email
      email = `facebook_${id}@facebook.placeholder`;
      needsEmail = true;

      // Log warning for debugging
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        console.warn(`[PRODUCTION] Facebook user ${id} does not have email. User will be prompted to enter email.`);
      } else {
        console.warn(`[DEV] Facebook user ${id} does not have email. Using placeholder: ${email}`);
      }
    }

    // Generate username from name or use Facebook username/ID
    const displayName = `${name?.givenName || ''} ${name?.familyName || ''}`.trim() ||
      username ||
      `Facebook User ${id}`;

    const user = {
      provider: 'facebook',
      providerId: id,
      email: email,
      displayName: displayName,
      avatar: photos?.[0]?.value,
      accessToken,
      needsEmail, // Flag to indicate if email needs to be collected
    };

    const result = await this.authService.validateOAuthUser(user);
    done(null, result);
  }
}

