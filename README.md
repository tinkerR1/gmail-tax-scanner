# Gmail Tax Document Scanner

Automatically save tax-related PDF attachments from Gmail to Google Drive. Get email alerts when tax documents need manual download.

Built with Google Apps Script — free, runs in the cloud, no server required.

## What It Does

- **Scans your Gmail** daily for emails containing "tax" in the Primary inbox
- - **Saves PDF attachments** automatically to a Google Drive folder
  - - **Sends you an alert** when a tax email has no PDF (e.g., "log in to download your 1099")
    - - **Skips duplicates** so you don't get the same document twice
      - - **Runs automatically** — set it and forget it
       
        - ## Setup Guide (5 minutes)
       
        - ### Step 1: Create the Script
       
        - 1. Go to [script.google.com](https://script.google.com)
          2. 2. Click **New Project**
             3. 3. Delete any placeholder code in the editor
                4. 4. Copy the entire contents of `Code.gs` from this repo
                   5. 5. Paste it into the editor
                      6. 6. Click **File → Save** (or Cmd/Ctrl + S)
                         7. 7. Name your project (e.g., "Tax Document Scanner")
                           
                            8. ### Step 2: Customize Settings (Optional)
                           
                            9. At the top of the script, you'll find a `CONFIG` section. The defaults work great, but you can customize:
                           
                            10. ```javascript
                                const CONFIG = {
                                  FOLDER_NAME: "2026 Tax Documents",    // Google Drive folder name
                                  SEARCH_KEYWORDS: ["tax"],              // Words to search for
                                  EXCLUDE_LABEL: "Inbox Done",           // Skip emails with this label (or set to "")
                                  DAYS_TO_SEARCH: 30,                    // How far back to look
                                  SCAN_HOUR: 12,                         // Hour to run (24-hour format)
                                  SCAN_MINUTE: 30,                       // Minute to run
                                  TIMEZONE: "America/New_York"           // Your timezone
                                };
                                ```

                                ### Step 3: Run Setup

                                1. In the toolbar, find the dropdown that says "Select function" (or shows a function name)
                                2. 2. Select **`setup`**
                                   3. 3. Click the **Run** button (▶️)
                                      4. 4. Google will ask you to authorize permissions:
                                         5.    - Click "Review permissions"
                                               -    - Choose your Google account
                                                    -    - Click "Advanced" → "Go to [Project Name] (unsafe)"
                                                         -    - Click "Allow"
                                                          
                                                              - The setup function creates:
                                                              - - A folder in Google Drive called "2026 Tax Documents"
                                                                - - A Gmail label called "TaxDocsProcessed" to track what's been scanned
                                                                  - - A daily trigger to run the scanner automatically
                                                                   
                                                                    - ### Step 4: Test It
                                                                   
                                                                    - 1. Select **`manualScan`** from the dropdown
                                                                      2. 2. Click **Run**
                                                                         3. 3. Check the **Execution log** at the bottom to see results
                                                                           
                                                                            4. You should see output like:
                                                                            5. ```
                                                                               Searching with query: ("tax") category:primary -label:TaxDocsProcessed newer_than:30d
                                                                               Found 3 threads to process
                                                                               Saved: 2024-01-15_Fidelity_1099-DIV.pdf
                                                                               Alert sent for: Your tax documents are ready
                                                                               Scan complete. Saved: 1 PDFs, Alerts sent: 1
                                                                               ```

                                                                               ## How It Works

                                                                               ```
                                                                               ┌─────────────────────────────────────────────────────────────┐
                                                                               │                    Gmail Inbox                              │
                                                                               │  ┌─────────────────────────────────────────────────────┐   │
                                                                               │  │ Email: "Your 2024 Tax Documents"                    │   │
                                                                               │  │ From: Fidelity                                      │   │
                                                                               │  │ Attachment: 1099-DIV.pdf ✓                          │   │
                                                                               │  └─────────────────────────────────────────────────────┘   │
                                                                               └─────────────────────────────────────────────────────────────┘
                                                                                                           │
                                                                                                           ▼
                                                                               ┌─────────────────────────────────────────────────────────────┐
                                                                               │                 Tax Document Scanner                        │
                                                                               │                                                             │
                                                                               │  1. Search for emails with "tax" in Primary inbox          │
                                                                               │  2. Check if PDF is attached                                │
                                                                               │     - YES → Save to Google Drive                           │
                                                                               │     - NO  → Send alert email                               │
                                                                               │  3. Label email as processed                                │
                                                                               └─────────────────────────────────────────────────────────────┘
                                                                                                           │
                                                                                               ┌───────────┴───────────┐
                                                                                               ▼                       ▼
                                                                               ┌───────────────────────┐   ┌───────────────────────┐
                                                                               │    Google Drive       │   │    Alert Email        │
                                                                               │                       │   │                       │
                                                                               │ 📁 2026 Tax Documents │   │ "Action Needed:       │
                                                                               │  └─ 1099-DIV.pdf     │   │  Tax doc requires     │
                                                                               │  └─ W-2.pdf          │   │  manual download"     │
                                                                               │  └─ 1099-INT.pdf     │   │                       │
                                                                               └───────────────────────┘   └───────────────────────┘
                                                                               ```

                                                                               ## Useful Commands

                                                                               Run these from the function dropdown in Apps Script:

                                                                               | Function | What it does |
                                                                               |----------|--------------|
                                                                               | `setup` | Initial setup (run once) |
                                                                               | `manualScan` | Run a scan right now |
                                                                               | `viewConfig` | Show current settings in the log |
                                                                               | `removeTriggers` | Stop the daily scanner |

                                                                               ## Customization Examples

                                                                               ### Search for more keywords

                                                                               ```javascript
                                                                               SEARCH_KEYWORDS: ["tax", "1099", "W-2", "statement"],
                                                                               ```

                                                                               ### Change the schedule to 9 AM Pacific

                                                                               ```javascript
                                                                               SCAN_HOUR: 9,
                                                                               SCAN_MINUTE: 0,
                                                                               TIMEZONE: "America/Los_Angeles"
                                                                               ```

                                                                               ### Don't exclude any labels

                                                                               ```javascript
                                                                               EXCLUDE_LABEL: "",
                                                                               ```

                                                                               ### Search further back

                                                                               ```javascript
                                                                               DAYS_TO_SEARCH: 90,
                                                                               ```

                                                                               ## Troubleshooting

                                                                               ### "Authorization required" error
                                                                               Run `setup` again and re-authorize when prompted.

                                                                               ### Not finding expected emails
                                                                               - Check that the email contains your search keyword
                                                                               - - Make sure it's in the Primary tab (not Promotions/Updates)
                                                                                 - - Verify it's within your `DAYS_TO_SEARCH` window
                                                                                   - - Check if it already has the `TaxDocsProcessed` label
                                                                                    
                                                                                     - ### Getting duplicate alerts
                                                                                     - The script labels processed emails. If you're getting duplicates, the label might have been removed. Check your Gmail labels.
                                                                                    
                                                                                     - ### Want to re-process an email
                                                                                     - Remove the `TaxDocsProcessed` label from the email, then run `manualScan`.
                                                                                    
                                                                                     - ## Privacy & Security
                                                                                    
                                                                                     - - The script only accesses **your own** Gmail and Google Drive
                                                                                       - - No data is sent to any external servers
                                                                                         - - The script runs entirely within Google's infrastructure
                                                                                           - - You can review exactly what it does — it's all in `Code.gs`
                                                                                            
                                                                                             - ## License
                                                                                            
                                                                                             - MIT License — use it however you want.
                                                                                            
                                                                                             - ## Contributing
                                                                                            
                                                                                             - Found a bug or have an idea? Open an issue or PR!
