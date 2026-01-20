/**
 * Gmail Tax Document Scanner
 * Automatically saves tax-related PDFs from Gmail to Google Drive
 * 
 * GitHub: https://github.com/tinkerR1/gmail-tax-scanner
 * 
 * Features:
 * - Scans Primary inbox for emails containing "tax"
 * - Saves PDF attachments to a Google Drive folder
 * - Sends email alerts when tax emails have no PDF (so you can download manually)
 * - Runs automatically on a daily schedule
 * - Skips already-processed emails to avoid duplicates
 */

// ============================================
// CONFIGURATION - Customize these settings
// ============================================
const CONFIG = {
  // Name of the Google Drive folder to save PDFs to
  FOLDER_NAME: "2026 Tax Documents",

  // Keywords to search for (emails containing ANY of these words)
  SEARCH_KEYWORDS: ["tax"],

  // Gmail label used to track processed emails (created automatically)
  PROCESSED_LABEL: "TaxDocsProcessed",

  // Optional: Gmail label to EXCLUDE from scanning (set to "" to disable)
  // Useful if you have a label for emails you've already dealt with
  EXCLUDE_LABEL: "Inbox Done",

  // How far back to search (in days)
  DAYS_TO_SEARCH: 30,

  // Your email is detected automatically, but you can override it here
  YOUR_EMAIL: Session.getActiveUser().getEmail(),

  // Subject line for alert emails
  ALERT_SUBJECT: "Action Needed: Tax doc requires manual download",

  // Schedule settings (24-hour format, in your timezone)
  SCAN_HOUR: 12,        // Hour to run (0-23)
  SCAN_MINUTE: 30,      // Minute to run (0-59)
  TIMEZONE: "America/New_York"
};

// ============================================
// SETUP - Run this once to initialize
// ============================================
function setup() {
  // Create Google Drive folder if it doesn't exist
  const folders = DriveApp.getFoldersByName(CONFIG.FOLDER_NAME);
  let folder;
  if (folders.hasNext()) {
    folder = folders.next();
    Logger.log("Folder already exists: " + folder.getUrl());
  } else {
    folder = DriveApp.createFolder(CONFIG.FOLDER_NAME);
    Logger.log("Created folder: " + folder.getUrl());
  }

  // Create Gmail label for processed emails
  let label = GmailApp.getUserLabelByName(CONFIG.PROCESSED_LABEL);
  if (!label) {
    label = GmailApp.createLabel(CONFIG.PROCESSED_LABEL);
    Logger.log("Created label: " + CONFIG.PROCESSED_LABEL);
  }

  // Delete existing triggers to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'scanForTaxDocs') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create daily trigger
  ScriptApp.newTrigger('scanForTaxDocs')
    .timeBased()
    .atHour(CONFIG.SCAN_HOUR)
    .nearMinute(CONFIG.SCAN_MINUTE)
    .everyDays(1)
    .inTimezone(CONFIG.TIMEZONE)
    .create();

  Logger.log("Daily trigger set for " + CONFIG.SCAN_HOUR + ":" + CONFIG.SCAN_MINUTE + " " + CONFIG.TIMEZONE);
  Logger.log("Setup complete! The scanner will run daily.");
}

// ============================================
// MAIN SCANNER FUNCTION
// ============================================
function scanForTaxDocs() {
  const folder = getOrCreateFolder();
  const processedLabel = GmailApp.getUserLabelByName(CONFIG.PROCESSED_LABEL) 
                         || GmailApp.createLabel(CONFIG.PROCESSED_LABEL);

  // Build search query
  const keywords = CONFIG.SEARCH_KEYWORDS.map(k => '"' + k + '"').join(" OR ");
  let searchQuery = "(" + keywords + ") category:primary -label:" + CONFIG.PROCESSED_LABEL;

  // Add exclude label if configured
  if (CONFIG.EXCLUDE_LABEL && CONFIG.EXCLUDE_LABEL.length > 0) {
    searchQuery += " -label:" + CONFIG.EXCLUDE_LABEL.replace(/ /g, '-');
  }

  searchQuery += " newer_than:" + CONFIG.DAYS_TO_SEARCH + "d";

  Logger.log("Searching with query: " + searchQuery);

  const threads = GmailApp.search(searchQuery, 0, 50);
  Logger.log("Found " + threads.length + " threads to process");

  let savedCount = 0;
  let alertCount = 0;

  threads.forEach(thread => {
    const messages = thread.getMessages();

    messages.forEach(message => {
      const subject = message.getSubject();
      const from = message.getFrom();
      const date = message.getDate();
      const messageId = message.getId();

      // Check if this message has PDF attachments
      const attachments = message.getAttachments();
      const pdfAttachments = attachments.filter(att => 
        att.getContentType() === 'application/pdf' || 
        att.getName().toLowerCase().endsWith('.pdf')
      );

      if (pdfAttachments.length > 0) {
        // Save PDFs to Drive
        pdfAttachments.forEach(pdf => {
          const fileName = formatFileName(pdf.getName(), from, date);
          const existingFiles = folder.getFilesByName(fileName);

          if (!existingFiles.hasNext()) {
            folder.createFile(pdf.copyBlob().setName(fileName));
            Logger.log("Saved: " + fileName);
            savedCount++;
          } else {
            Logger.log("Already exists: " + fileName);
          }
        });
      } else {
        // No PDF - send alert email
        sendAlertEmail(subject, from, date, messageId);
        alertCount++;
      }
    });

    // Mark thread as processed
    thread.addLabel(processedLabel);
  });

  Logger.log("Scan complete. Saved: " + savedCount + " PDFs, Alerts sent: " + alertCount);

  // Send summary if anything was processed
  if (savedCount > 0 || alertCount > 0) {
    sendSummaryEmail(savedCount, alertCount, folder.getUrl());
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getOrCreateFolder() {
  const folders = DriveApp.getFoldersByName(CONFIG.FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(CONFIG.FOLDER_NAME);
}

function formatFileName(originalName, from, date) {
  const dateStr = Utilities.formatDate(date, CONFIG.TIMEZONE, "yyyy-MM-dd");
  const senderMatch = from.match(/^([^<]+)/);
  const senderName = senderMatch ? senderMatch[1].trim() : from.split('@')[0];
  const cleanSender = senderName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);

  const baseName = originalName.replace(/\.pdf$/i, '');

  return dateStr + "_" + cleanSender + "_" + baseName + ".pdf";
}

function sendAlertEmail(subject, from, date, messageId) {
  const emailLink = "https://mail.google.com/mail/u/0/#inbox/" + messageId;
  const dateStr = Utilities.formatDate(date, CONFIG.TIMEZONE, "MMM dd, yyyy");

  const body = "A tax-related email was found but it doesn't have a PDF attachment. You may need to log in to download the document.\n\n" +
    "Subject: " + subject + "\n" +
    "From: " + from + "\n" +
    "Date: " + dateStr + "\n\n" +
    "Open Email: " + emailLink + "\n\n" +
    "---\nThis alert was sent by Gmail Tax Document Scanner.";

  GmailApp.sendEmail(CONFIG.YOUR_EMAIL, CONFIG.ALERT_SUBJECT, body);
  Logger.log("Alert sent for: " + subject);
}

function sendSummaryEmail(savedCount, alertCount, folderUrl) {
  const body = "Tax Document Scanner - Daily Summary\n\n" +
    "PDFs saved to Drive: " + savedCount + "\n" +
    "Alerts sent (no PDF): " + alertCount + "\n\n" +
    "View your tax folder: " + folderUrl + "\n\n" +
    "---\nScan completed at " + new Date().toLocaleString("en-US", {timeZone: CONFIG.TIMEZONE});

  GmailApp.sendEmail(
    CONFIG.YOUR_EMAIL, 
    "Tax Doc Scanner: Daily Summary", 
    body
  );
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Run a manual scan (useful for testing)
 */
function manualScan() {
  Logger.log("Starting manual scan...");
  scanForTaxDocs();
  Logger.log("Manual scan complete.");
}

/**
 * View current configuration
 */
function viewConfig() {
  Logger.log("Current Configuration:");
  Logger.log("- Folder: " + CONFIG.FOLDER_NAME);
  Logger.log("- Keywords: " + CONFIG.SEARCH_KEYWORDS.join(", "));
  Logger.log("- Days to search: " + CONFIG.DAYS_TO_SEARCH);
  Logger.log("- Exclude label: " + (CONFIG.EXCLUDE_LABEL || "(none)"));
  Logger.log("- Your email: " + CONFIG.YOUR_EMAIL);
  Logger.log("- Schedule: " + CONFIG.SCAN_HOUR + ":" + CONFIG.SCAN_MINUTE + " " + CONFIG.TIMEZONE);

  const folder = getOrCreateFolder();
  Logger.log("- Folder URL: " + folder.getUrl());

  const triggers = ScriptApp.getProjectTriggers();
  Logger.log("- Active triggers: " + triggers.length);
}

/**
 * Remove all triggers (useful if you want to stop the scanner)
 */
function removeTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  Logger.log("All triggers removed. Scanner is now disabled.");
}
