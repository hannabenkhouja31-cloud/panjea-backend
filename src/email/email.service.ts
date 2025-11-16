import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  private readonly frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  async sendWelcomeEmail(email: string, username: string, verificationToken: string): Promise<void> {
    this.logger.log(`=== START WELCOME EMAIL ===`);
    this.logger.log(`Recipient: ${email}`);
    this.logger.log(`Username: ${username}`);
    this.logger.log(`Token: ${verificationToken.substring(0, 10)}...`);
    
    try {
      const appId = process.env.ONESIGNAL_APP_ID;
      const apiKey = process.env.ONESIGNAL_API_KEY;
      const fromName = process.env.ONESIGNAL_EMAIL_FROM_NAME || 'Panjéa';
      const fromAddress = process.env.ONESIGNAL_EMAIL_FROM_ADDRESS;
      const welcomeTemplateId = process.env.ONESIGNAL_WELCOME_TEMPLATE_ID;
      const verificationUrl = `${this.backendUrl}/email-verification/verify?token=${verificationToken}`;

      this.logger.log(`OneSignal Config:`);
      this.logger.log(`- App ID: ${appId ? '✓' : '✗'}`);
      this.logger.log(`- API Key: ${apiKey ? '✓ (hidden)' : '✗'}`);

      this.logger.log(`Subscribing email to OneSignal...`);
      try {
        const subscribeResponse = await fetch(`https://api.onesignal.com/apps/${appId}/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Key ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriptions: [{
              type: 'Email',
              token: email,
              enabled: true
            }]
          })
        });
        
        const subscribeResult = await subscribeResponse.json();
        this.logger.log(`Subscribe response:`, JSON.stringify(subscribeResult, null, 2));
      } catch (subscribeError) {
        this.logger.warn(`Subscribe failed (continuing anyway):`, subscribeError);
      }

      const payload = {
        app_id: appId,
        email_to: [email],
        target_channel: 'email',
        email_subject: 'Bienvenue sur Panjéa ! 🌍',
        template_id: welcomeTemplateId,
        custom_data: {
          username: username,
          verification_url: verificationUrl,
          explore_url: `${this.frontendUrl}/voyage`,
        },
        email_from_name: fromName,
        email_from_address: fromAddress,
      };

      this.logger.log(`Sending request to OneSignal...`);
      const response = await fetch('https://api.onesignal.com/notifications?c=email', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      this.logger.log(`OneSignal Response Status: ${response.status}`);
      const result = await response.json();
      this.logger.log(`OneSignal full response:`, JSON.stringify(result, null, 2));

      if (result.errors) {
        this.logger.error(`❌ OneSignal returned errors:`, JSON.stringify(result.errors, null, 2));
        throw new Error(`OneSignal API error: ${JSON.stringify(result.errors)}`);
      }

      if (!result.id) {
        throw new Error(`Failed to send email: ${JSON.stringify(result)}`);
      }

      this.logger.log(`✓ Welcome email sent successfully - ID: ${result.id}`);
      this.logger.log(`=== END WELCOME EMAIL ===\n`);
    } catch (error) {
      this.logger.error(`✗ Error sending welcome email:`, error);
      this.logger.log(`=== END WELCOME EMAIL (ERROR) ===\n`);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    this.logger.log(`=== START PASSWORD RESET EMAIL ===`);
    this.logger.log(`Recipient: ${email}`);
    this.logger.log(`Token: ${token.substring(0, 10)}...`);
    
    try {
      const appId = process.env.ONESIGNAL_APP_ID;
      const apiKey = process.env.ONESIGNAL_API_KEY;
      const fromName = process.env.ONESIGNAL_EMAIL_FROM_NAME || 'Panjéa';
      const fromAddress = process.env.ONESIGNAL_EMAIL_FROM_ADDRESS;
      const passwordResetTemplateId = process.env.ONESIGNAL_PASSWORD_RESET_TEMPLATE_ID;
      const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

      this.logger.log(`OneSignal Config:`);
      this.logger.log(`- App ID: ${appId ? '✓' : '✗'}`);
      this.logger.log(`- API Key: ${apiKey ? '✓ (hidden)' : '✗'}`);
      this.logger.log(`- Template ID: ${passwordResetTemplateId || '✗'}`);
      this.logger.log(`- From: ${fromName} <${fromAddress}>`);
      this.logger.log(`- Reset URL: ${resetUrl}`);

      const payload = {
        app_id: appId,
        email_to: [email],
        target_channel: 'email',
        email_subject: 'Réinitialisation de ton mot de passe - Panjéa',
        template_id: passwordResetTemplateId,
        custom_data: {
          reset_url: resetUrl,
        },
        email_from_name: fromName,
        email_from_address: fromAddress,
      };

      this.logger.log(`Sending request to OneSignal...`);
      const response = await fetch('https://api.onesignal.com/notifications?c=email', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      this.logger.log(`OneSignal Response Status: ${response.status}`);

      if (!response.ok) {
        const error = await response.json();
        this.logger.error(`OneSignal API error:`, JSON.stringify(error, null, 2));
        throw new Error(`Failed to send password reset email: ${JSON.stringify(error)}`);
      }

      const result = await response.json();
      this.logger.log(`✓ Password reset email sent successfully - ID: ${result.id}`);
      this.logger.log(`=== END PASSWORD RESET EMAIL ===\n`);
    } catch (error) {
      this.logger.error(`✗ Error sending password reset email:`, error);
      this.logger.log(`=== END PASSWORD RESET EMAIL (ERROR) ===\n`);
      throw error;
    }
  }
}