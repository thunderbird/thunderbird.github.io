Install needed packages
=======================

```
npm install fs-extra bent
```

Run
===

```
node get_bugzilla_data.js "Thunderbird" "2020-01-01"
node get_bugzilla_data.js "Calendar" "2020-01-01"
node get_bugzilla_data.js "MailNews Core" "2020-01-01"
node bugzilla_report.js data/*
```
