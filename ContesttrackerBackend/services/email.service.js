import nodemailer from "nodemailer";

let transporter = null;

export const getEmailTransporter = () => {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.warn(
      "⚠️ EMAIL_USER or EMAIL_PASS not configured in environment variables. Emails will be logged to console."
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  return transporter;
};

const formatISTDateTime = (date) => {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(date)) + " IST";
};

/**
 * Send Contest Reminder Email (sent X minutes before contest starts)
 */
export const sendContestReminderEmail = async ({
  to,
  username,
  contestName,
  platform,
  startTime,
  contestUrl,
  remindBeforeMinutes,
}) => {
  const mailTransporter = getEmailTransporter();
  const timeIST = formatISTDateTime(startTime);

  const subject = `⏰ Reminder: ${contestName} (${platform}) starts in ${remindBeforeMinutes} minutes!`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0e14; color: #e6e8ef; margin: 0; padding: 24px; }
        .card { max-width: 580px; margin: 0 auto; background-color: #131720; border: 1px solid #232838; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
        .badge { display: inline-block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 9999px; background: rgba(79, 140, 255, 0.15); color: #4f8cff; margin-bottom: 12px; }
        h1 { font-size: 22px; color: #f2f4f8; margin: 0 0 16px; font-weight: 700; line-height: 1.3; }
        p { font-size: 14px; line-height: 1.6; color: #8a90a6; margin: 0 0 16px; }
        .details-box { background-color: #0d1017; border: 1px solid #1f2433; border-radius: 12px; padding: 18px 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; font-size: 13.5px; margin-bottom: 8px; }
        .detail-row:last-child { margin-bottom: 0; }
        .detail-label { color: #8a90a6; }
        .detail-value { color: #f2f4f8; font-weight: 600; }
        .btn-container { text-align: center; margin-top: 28px; }
        .btn { display: inline-block; background-color: #4f8cff; color: #0b0e14 !important; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 10px; text-decoration: none; transition: opacity 0.2s; }
        .footer { font-size: 12px; color: #545b70; text-align: center; margin-top: 28px; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">${platform} Contest</span>
        <h1>Get Ready, ${username || "Coder"}!</h1>
        <p>You requested a reminder for this contest. It's kicking off in <strong>${remindBeforeMinutes} minutes</strong>. Make sure your setup is ready and best of luck!</p>
        
        <div class="details-box">
          <div class="detail-row">
            <span class="detail-label">Contest Name</span>
            <span class="detail-value">${contestName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Platform</span>
            <span class="detail-value">${platform}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Start Time</span>
            <span class="detail-value">${timeIST}</span>
          </div>
        </div>

        <div class="btn-container">
          <a href="${contestUrl}" class="btn" target="_blank">Participate Now &rarr;</a>
        </div>

        <div class="footer">
          Sent by ContTrack · Coding Contest Tracker Platform
        </div>
      </div>
    </body>
    </html>
  `;

  if (!mailTransporter) {
    console.log(`[EMAIL SIMULATION] Sending reminder to ${to}: ${subject}`);
    return { simulated: true };
  }

  const info = await mailTransporter.sendMail({
    from: `"ContTrack Alerts" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  return info;
};

/**
 * Send Confirmation Email when a reminder is first registered
 */
export const sendReminderConfirmationEmail = async ({
  to,
  username,
  contestName,
  platform,
  startTime,
  contestUrl,
  remindBeforeMinutes,
}) => {
  const mailTransporter = getEmailTransporter();
  const timeIST = formatISTDateTime(startTime);

  const subject = `✅ Reminder Confirmed: ${contestName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0e14; color: #e6e8ef; margin: 0; padding: 24px; }
        .card { max-width: 580px; margin: 0 auto; background-color: #131720; border: 1px solid #232838; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
        .badge { display: inline-block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 9999px; background: rgba(47, 217, 168, 0.15); color: #2fd9a8; margin-bottom: 12px; }
        h1 { font-size: 22px; color: #f2f4f8; margin: 0 0 16px; font-weight: 700; line-height: 1.3; }
        p { font-size: 14px; line-height: 1.6; color: #8a90a6; margin: 0 0 16px; }
        .details-box { background-color: #0d1017; border: 1px solid #1f2433; border-radius: 12px; padding: 18px 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; font-size: 13.5px; margin-bottom: 8px; }
        .detail-row:last-child { margin-bottom: 0; }
        .detail-label { color: #8a90a6; }
        .detail-value { color: #f2f4f8; font-weight: 600; }
        .footer { font-size: 12px; color: #545b70; text-align: center; margin-top: 28px; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">Reminder Registered</span>
        <h1>We've got you covered, ${username || "Coder"}!</h1>
        <p>You have successfully registered for a contest reminder. We will email you <strong>${remindBeforeMinutes} minutes before</strong> the contest kicks off.</p>
        
        <div class="details-box">
          <div class="detail-row">
            <span class="detail-label">Contest</span>
            <span class="detail-value">${contestName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Platform</span>
            <span class="detail-value">${platform}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Scheduled Start</span>
            <span class="detail-value">${timeIST}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Alert Timing</span>
            <span class="detail-value">${remindBeforeMinutes} minutes before</span>
          </div>
        </div>

        <div class="footer">
          Sent by ContTrack · Coding Contest Tracker Platform
        </div>
      </div>
    </body>
    </html>
  `;

  if (!mailTransporter) {
    console.log(`[EMAIL SIMULATION] Sending confirmation to ${to}: ${subject}`);
    return { simulated: true };
  }

  const info = await mailTransporter.sendMail({
    from: `"ContTrack Alerts" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  return info;
};
