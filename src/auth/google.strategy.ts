import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions } from 'passport-google-oauth20';

export type GoogleValidatedUser = {
  email: string;
  firstName: string;
  lastName: string;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly config: ConfigService) {
    const appUrl = config.getOrThrow<string>('APP_URL').replace(/\/$/, '');
    const options: StrategyOptions = {
      clientID: config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: `${appUrl}/api/auth/google/callback`,
      scope: ['email', 'profile'],
    };
    super(options);
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      emails?: { value: string }[];
      name?: { givenName?: string; familyName?: string };
    },
  ): GoogleValidatedUser {
    const email = profile.emails?.[0]?.value;
    const firstName = profile.name?.givenName;
    const lastName = profile.name?.familyName;

    if (!email || !firstName || !lastName) {
      throw new Error('Missing email or name from Google profile');
    }

    return { email, firstName, lastName };
  }
}
