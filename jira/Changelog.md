#Changelog

## highlight_subtasks.user.js

* 1.2.0 Update to jira cloud version

## redirect-jira.user.js

* 1.0.2 Update default url to cloud version

## issue_buttons.user.js
* 3.0.3. Fix error where description sometimes was copied twice
* 3.0.2. Replace contextmenu event with auxclick, since the former is no longer thrown
* 3.0.1. Fix error where action wasn't performed as desired
* 3.0.0. Update to Jira react version
* 2.2.3. Improve robustness of context menu event code
* 2.2.2. Fix issue, that path was not found on contextmenu event
* 2.2.1. Export branch name in lower key
* 2.2.0. Add support for navigation between pages
* 2.1.0. Add support for backlog page
* 2.0.2. Fix branch name generation, s.t. it uses lowercase key and detects sups
* 2.0.1. Add download url
* 2.0.0. Update to jira cloud version
    * Now working in jira cloud
    * Use contextmenu instead of buttons
    * Copy URLs the right way (text and html) so tex can be better used in other applications
    * Prepare to be used on backlog and on detail site
    * general cleanup
* 1.1.1. updates the script update url and changes the file extension to *.user.js s.t. tampermonkey recognises the
  script
* 1.1.0. adds a new button to copy the Key and Title of the issue e.g. _XYZ-1234 Add a new Button_
* 1.0.3. adds a missing question in prompt to get the team name
* 1.0.2. some smaller fixes
* 1.0.1. adds an update url to the script
* 1.0.0. adds the script with a button to copy the url of an issue as a hyperlink in markdown syntax _\[XYZ-123](
  \<baseurl>/XYZ-123)_ and a button to copy as branch name