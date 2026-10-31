import nodemailer from "nodemailer";

let transporter = null;

export const getEmailTransporter = () => {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER?.trim();
  const rawPass = process.env.EMAIL_PASS?.trim();

  if (!emailUser || !rawPass) {
    return null;
  }

  const emailPass = rawPass.replace(/\s+/g, "");

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  return transporter;
};

const formatISTDateTime = (date) => {
  return (
    new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    }).format(new Date(date)) + " IST"
  );
};

/**
 * Unified Email Dispatcher
 * Priority:
 * 1. Brevo HTTP API (Port 443 - NEVER blocked by Render / cloud firewalls, 300 free/day)
 * 2. Resend HTTP API (Port 443)
 * 3. Nodemailer / Gmail SMTP (Port 465)
 */
export const dispatchEmail = async ({ to, subject, html }) => {
  const brevoKey = process.env.BREVO_API_KEY?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const senderEmail =
    process.env.SENDER_EMAIL?.trim() || process.env.EMAIL_USER?.trim();

  // 1. Brevo HTTP REST API (Best for Render - uses HTTPS Port 443)
  if (brevoKey) {
    const fromEmail = senderEmail || "notifications@conttrack.app";
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": brevoKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "ContTrack Alerts",
          email: fromEmail,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        data.message ||
          `Brevo email delivery failed with status ${res.status}`
      );
    }
    return { success: true, provider: "brevo", data };
  }

  // 2. Resend HTTP REST API (Uses HTTPS Port 443)
  if (resendKey) {
    const fromEmail = senderEmail || "onboarding@resend.dev";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `ContTrack Alerts <${fromEmail}>`,
        to: [to],
        subject,
        html,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        data.message ||
          `Resend email delivery failed with status ${res.status}`
      );
    }
    return { success: true, provider: "resend", data };
  }

  // 3. Fallback: Nodemailer SMTP
  const mailTransporter = getEmailTransporter();
  if (mailTransporter) {
    const fromAddress = process.env.EMAIL_USER?.trim();
    const info = await mailTransporter.sendMail({
      from: `"ContTrack Alerts" <${fromAddress}>`,
      to,
      subject,
      html,
    });
    return { success: true, provider: "nodemailer", data: info };
  }

  // Simulation mode
  console.log(`[EMAIL SIMULATION] To: ${to} | Subject: ${subject}`);
  return { simulated: true };
};

/**
 * Send Contest Reminder Email
 * Handles both 1-Day (24h) alert and 1-Hour alert
 */
export const sendContestReminderEmail = async ({
  to,
  username,
  contestName,
  platform,
  startTime,
  contestUrl,
  alertType, // "1_day" | "1_hour" | "30_min"
}) => {
  const timeIST = formatISTDateTime(startTime);

  const isOneDay = alertType === "1_day";
  const badgeLabel = isOneDay ? "📅 1-Day Advance Alert" : "⏰ 1-Hour Final Alert";
  const badgeBg = isOneDay ? "rgba(79, 140, 255, 0.15)" : "rgba(247, 184, 75, 0.15)";
  const badgeColor = isOneDay ? "#4f8cff" : "#f7b84b";

  const subject = isOneDay
    ? `📅 Tomorrow: ${contestName} (${platform}) starts in 24 hours!`
    : `⏰ 1 Hour to Go: ${contestName} (${platform}) starts soon!`;

  const headline = isOneDay
    ? `Contest Tomorrow, ${username || "Coder"}!`
    : `Starting in 1 Hour, ${username || "Coder"}!`;

  const description = isOneDay
    ? `This is your <strong>1-day advance reminder</strong> for <strong>${contestName}</strong> on <strong>${platform}</strong>. Take some time to review problem patterns, get a good night's rest, and prepare yourself. We'll send you another quick alert 1 hour before the contest starts!`
    : `Your contest <strong>${contestName}</strong> on <strong>${platform}</strong> kicks off in <strong>60 minutes</strong>! Log in to the platform, check your editor setup, and get ready to solve.`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0e14; color: #e6e8ef; margin: 0; padding: 24px; }
        .card { max-width: 580px; margin: 0 auto; background-color: #131720; border: 1px solid #232838; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
        .badge { display: inline-block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 5px 12px; border-radius: 9999px; background: ${badgeBg}; color: ${badgeColor}; margin-bottom: 14px; }
        h1 { font-size: 22px; color: #f2f4f8; margin: 0 0 16px; font-weight: 700; line-height: 1.3; }
        p { font-size: 14px; line-height: 1.6; color: #8a90a6; margin: 0 0 16px; }
        .details-box { background-color: #0d1017; border: 1px solid #1f2433; border-radius: 12px; padding: 18px 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; font-size: 13.5px; margin-bottom: 8px; }
        .detail-row:last-child { margin-bottom: 0; }
        .detail-label { color: #8a90a6; }
        .detail-value { color: #f2f4f8; font-weight: 600; }
        .btn-container { text-align: center; margin-top: 28px; }
        .btn { display: inline-block; background-color: #4f8cff; color: #0b0e14 !important; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 10px; text-decoration: none; }
        .footer { font-size: 12px; color: #545b70; text-align: center; margin-top: 28px; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">${badgeLabel} · ${platform}</span>
        <h1>${headline}</h1>
        <p>${description}</p>
        
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
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value">${isOneDay ? "Starts in 24 hours" : "Starts in 1 hour"}</span>
          </div>
        </div>

        <div class="btn-container">
          <a href="${contestUrl}" class="btn" target="_blank">Participate in Contest &rarr;</a>
        </div>

        <div class="footer">
          Sent by ContTrack · Coding Contest Tracker Platform
        </div>
      </div>
    </body>
    </html>
  `;

  return await dispatchEmail({ to, subject, html });
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
  reminderScheduleText,
}) => {
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
        <p>You have successfully registered for contest reminders. We will email you <strong>${reminderScheduleText || "1 day and 1 hour before"}</strong> the contest kicks off.</p>
        
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
            <span class="detail-label">Reminders</span>
            <span class="detail-value">${reminderScheduleText || "1 day before & 1 hour before"}</span>
          </div>
        </div>

        <div class="footer">
          Sent by ContTrack · Coding Contest Tracker Platform
        </div>
      </div>
    </body>
    </html>
  `;

  return await dispatchEmail({ to, subject, html });
};
