import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UserService } from './user.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private userService: UserService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/users/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id, name, emails, photos } = profile;

      const user = {
        googleId: id,
        email: emails[0].value,
        fullName: `${name.givenName} ${name.familyName}`,
        profilePicture: photos[0]?.value,
        isGoogleUser: true,
        googleEmail: emails[0].value,
        googleProfilePicture: photos[0]?.value,
        googleVerified: emails[0].verified || true,
        isEmailVerified: emails[0].verified || true,
      };

      const existingUser = await this.userService.findOrCreateGoogleUser(user);
      done(null, existingUser);
    } catch (error) {
      console.error('Erro na validação do Google OAuth:', error);
      done(error, false);
    }
  }
}
