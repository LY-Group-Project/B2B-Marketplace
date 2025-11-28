const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const {
  ZOHO_SMTP_HOST,
  ZOHO_SMTP_PORT,
  ZOHO_SMTP_SECURE,
  ZOHO_SMTP_USER,
  ZOHO_SMTP_PASS,
  MAIL_FROM
} = process.env;

let transporter;

// Template cache to avoid repeated file reads
const templateCache = new Map();

function createTransporter() {
  if (transporter) return transporter;

  // sensible defaults for Zoho if environment values missing
  const host = ZOHO_SMTP_HOST || 'smtp.zoho.com';
  const port = ZOHO_SMTP_PORT ? parseInt(ZOHO_SMTP_PORT, 10) : 465;
  const secure = typeof ZOHO_SMTP_SECURE !== 'undefined' ? (ZOHO_SMTP_SECURE === 'true' || ZOHO_SMTP_SECURE === true) : (port === 465);

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: ZOHO_SMTP_USER,
      pass: ZOHO_SMTP_PASS
    }
  });

  return transporter;
}

function replaceTokens(template, data) {
  if (!template) return template;

  let out = String(template);

  // If data is an array, replace numeric tokens {1} {2} ...
  if (Array.isArray(data)) {
    data.forEach((val, idx) => {
      const token = new RegExp('\\{' + (idx + 1) + '\\}', 'g');
      out = out.replace(token, String(val == null ? '' : val));
    });
    return out;
  }

  // If data is an object, replace keys {name}, {email}, and numeric keys too
  if (data && typeof data === 'object') {
    Object.keys(data).forEach((key) => {
      const safeKey = key.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&');
      const token = new RegExp('\\{' + safeKey + '\\}', 'g');
      out = out.replace(token, String(data[key] == null ? '' : data[key]));
    });

    // also handle numeric-like keys if present
    Object.keys(data).forEach((key) => {
      if (/^\\d+$/.test(key)) {
        const token = new RegExp('\\{' + key + '\\}', 'g');
        out = out.replace(token, String(data[key] == null ? '' : data[key]));
      }
    });
  }

  return out;
}

/**
 * loadTemplate - loads an HTML email template from disk
 * @param {string} templateName - name of template file (without .html extension)
 * @returns {string} template content
 */
function loadTemplate(templateName) {
  // Check cache first
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName);
  }

  const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateName}.html`);
  }

  const content = fs.readFileSync(templatePath, 'utf8');
  
  // Cache in production, skip in dev for easier updates
  if (process.env.NODE_ENV === 'production') {
    templateCache.set(templateName, content);
  }
  
  return content;
}

/**
 * normalizeAttachments - convert various attachment inputs to nodemailer format
 * Accepts array of: {path, filename, content, cid} or simple file paths
 */
function normalizeAttachments(attachments = []) {
  if (!Array.isArray(attachments)) return [];

  return attachments.map((att) => {
    if (!att) return null;
    if (typeof att === 'string') {
      // assume it's a file path
      return { path: att };
    }

    // if object, copy through expected fields
    const out = {};
    if (att.path) out.path = att.path;
    if (att.filename) out.filename = att.filename;
    if (att.content) out.content = att.content;
    if (att.cid) out.cid = att.cid; // for inline images
    if (att.encoding) out.encoding = att.encoding;
    if (att.contentType) out.contentType = att.contentType;

    // If `content` is a path file but user passed as { content: '/tmp/a.pdf' }
    if (out.content && typeof out.content === 'string' && fs.existsSync(out.content)) {
      out.path = out.content;
      delete out.content;
    }

    return out;
  }).filter(Boolean);
}

/**
 * sendMail - primary exported function
 * options: { to, cc, bcc, subject, text, html, template, templateName, templateData, attachments, from }
 * Use either:
 *  - template: inline HTML string with tokens
 *  - templateName: load from server/templates/{templateName}.html
 */
async function sendMail(options = {}) {
  const {
    to,
    cc,
    bcc,
    subject,
    text,
    html,
    template,
    templateName,
    templateData,
    attachments,
    from
  } = options;

  if (!to) throw new Error('`to` is required to send email');

  // Check if recipient domain is test.com and redirect to sender
  const recipientDomain = to.split('@')[1]?.toLowerCase();
  if (recipientDomain === 'test.com') {
    console.log(`[Mailer] Redirecting test email from ${to} to sender`);
    
    // Send to the actual sender instead, with modified subject
    const redirectedOptions = {
      ...options,
      to: from || MAIL_FROM || ZOHO_SMTP_USER,
      subject: `[TEST to: ${to}] ${subject || '(no subject)'}`
    };
    
    // Recursively call sendMail with redirected options
    // Remove this check by clearing the domain
    return sendMail({
      ...redirectedOptions,
      to: redirectedOptions.to.replace('@test.com', '') // Ensure we don't loop
    });
  }

  const t = createTransporter();

  // Prepare body
  let finalHtml = html;
  let finalText = text;

  if (templateName) {
    // Load template from file
    const templateContent = loadTemplate(templateName);
    finalHtml = replaceTokens(templateContent, templateData);
    if (templateData && templateData.text) finalText = templateData.text;
  } else if (template) {
    // template can be a string containing tokens
    finalHtml = replaceTokens(template, templateData);
    // If templateData includes a plain-text variant key `text`, allow that
    if (templateData && templateData.text) finalText = templateData.text;
  } else {
    // apply token replacement on provided html/text
    if (html) finalHtml = replaceTokens(html, templateData);
    if (text) finalText = replaceTokens(text, templateData);
  }

  const mailOptions = {
    from: from || MAIL_FROM || ZOHO_SMTP_USER,
    to,
    cc,
    bcc,
    subject: subject || '',
    text: finalText,
    html: finalHtml,
    attachments: normalizeAttachments(attachments)
  };

  try {
    const info = await t.sendMail(mailOptions);
    return { success: true, info };
  } catch (err) {
    // bubble up a helpful shape
    return { success: false, error: err };
  }
}

module.exports = {
  createTransporter,
  sendMail,
  loadTemplate,
  // expose transporter for advanced usage / tests
  get transporter() {
    return transporter || createTransporter();
  }
};
