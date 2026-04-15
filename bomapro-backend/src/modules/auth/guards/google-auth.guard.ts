import { ExecutionContext, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
	canActivate(context: ExecutionContext) {
		const hasGoogleOAuthConfig =
			!!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

		if (!hasGoogleOAuthConfig) {
			throw new ServiceUnavailableException(
				'Google OAuth is not configured on this deployment',
			);
		}

		return super.canActivate(context);
	}
}
