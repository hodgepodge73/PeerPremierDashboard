const Imap = require('imap');

const imapConfig = {
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASS,
  host: process.env.EMAIL_HOST,
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

function fetchEmails(searchTerm) {
  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig);
    let emails = []; // Array to hold email details

    imap.once('ready', function() {
      imap.openBox('INBOX', false, function(err, box) {
        if (err) {
          reject(err);
          return;
        }

        imap.search([['SUBJECT', searchTerm]], function(err, results) {
          if (err) {
            reject(err);
            return;
          }

          if (!results || !results.length) {
            console.log("No emails with the specified subject found.");
            resolve([]);
            imap.end();
            return;
          }

          const f = imap.fetch(results, { 
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
          });

          f.on('message', function(msg, seqno) {
            let email = { subject: '', date: '', body: '' };

            msg.on('body', function(stream, info) {
              let buffer = '';
              stream.on('data', function(chunk) {
                buffer += chunk.toString('utf8');
              });
              stream.once('end', function() {
                if (info.which === 'TEXT') {
                  email.body = buffer;
                } else {
                  const header = Imap.parseHeader(buffer);
                  email.subject = header.subject[0];
                  email.date = header.date[0];
                }
              });
            });

            msg.once('end', function() {
              emails.push(email);
            });
          });

          f.once('error', function(err) {
            reject(err);
          });

          f.once('end', function() {
            console.log('Done fetching all messages!');
            resolve(emails); // Resolve the array of emails
            imap.end();
          });
        });
      });
    });

    imap.once('error', function(err) {
      reject(err);
    });

    imap.once('end', function() {
      console.log('Connection ended');
    });

    imap.connect();
  });
}


module.exports = { fetchEmails };