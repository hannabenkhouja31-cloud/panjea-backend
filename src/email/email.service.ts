import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  private readonly frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  async sendWelcomeEmail(email: string, username: string, verificationToken: string): Promise<void> {
    try {
      const appId = process.env.ONESIGNAL_APP_ID;
      const apiKey = process.env.ONESIGNAL_API_KEY;
      const fromName = process.env.ONESIGNAL_EMAIL_FROM_NAME || 'Panjéa';
      const fromAddress = process.env.ONESIGNAL_EMAIL_FROM_ADDRESS;
      const welcomeTemplateId = process.env.ONESIGNAL_WELCOME_TEMPLATE_ID;
      const verificationUrl = `${this.backendUrl}/email-verification/verify?token=${verificationToken}`;

      const response = await fetch('https://api.onesignal.com/notifications?c=email', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OneSignal API error:', error);
        throw new Error('Failed to send welcome email');
      }

      const result = await response.json();
      console.log('Welcome email sent:', result.id);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    try {
      const appId = process.env.ONESIGNAL_APP_ID;
      const apiKey = process.env.ONESIGNAL_API_KEY;
      const fromName = process.env.ONESIGNAL_EMAIL_FROM_NAME || 'Panjéa';
      const fromAddress = process.env.ONESIGNAL_EMAIL_FROM_ADDRESS;
      const passwordResetTemplateId = process.env.ONESIGNAL_PASSWORD_RESET_TEMPLATE_ID;
      const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

      const response = await fetch('https://api.onesignal.com/notifications?c=email', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OneSignal API error:', error);
        throw new Error('Failed to send password reset email');
      }

      const result = await response.json();
      console.log('Password reset email sent:', result.id);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }
}