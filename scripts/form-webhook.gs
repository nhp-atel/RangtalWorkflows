/**
 * Fires when the Google Form is submitted.
 * Sends form data as JSON to the n8n webhook.
 *
 * Setup:
 * 1. Open the Google Form
 * 2. Click the three-dot menu → Script Editor
 * 3. Paste this code
 * 4. Replace N8N_WEBHOOK_URL with your actual n8n webhook URL
 * 5. Save
 * 6. Go to Triggers (clock icon) → Add Trigger:
 *    - Function: onFormSubmit
 *    - Event source: From form
 *    - Event type: On form submit
 * 7. Authorize when prompted
 */

var N8N_WEBHOOK_URL = 'https://<your-n8n-instance>.app.n8n.cloud/webhook/lead-intake';

function onFormSubmit(e) {
  var response = e.response;
  var items = response.getItemResponses();
  var data = {};

  items.forEach(function(item) {
    data[item.getItem().getTitle()] = item.getResponse();
  });

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(data),
    muteHttpExceptions: true
  };

  var result = UrlFetchApp.fetch(N8N_WEBHOOK_URL, options);
  Logger.log('n8n response: ' + result.getContentText());
}
