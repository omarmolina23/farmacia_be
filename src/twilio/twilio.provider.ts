import twilio from 'twilio';

export const TwilioProvider = {
  provide: 'TWILIO_CLIENT',
  useFactory: () => {
    return twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  },
};
