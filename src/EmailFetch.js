import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';

const EmailComponent = () => {
  const [emails, setEmails] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  //const [stages, setStages] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  const fetchEmails = () => {
    window.ipcRenderer.send('request-emails', searchTerm);
  };

  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
  };

  useEffect(() => {
    window.ipcRenderer.on('response-emails', (event, response) => {
        console.log(response);
      if (response.error) {
        setError(response.error);
      } else {
        setEmails(response);
      }
    });

    // Clean up the event listener
    return () => {
      window.ipcRenderer.removeAllListeners('response-emails');
    };
  }, []);

  async function handleSearch() {
    console.log('Searching for:', searchTerm);
    fetchEmails();
    setSearched(true);
    setSearchTerm(''); // Clear the TextField value
  };

  const groupEmailsByPhase = (pe) => {
    const grouped = {};

    pe.forEach((email) => {
      const phase = email.phase;

      if (!grouped[phase]) {
        grouped[phase] = [];
      }
      grouped[phase].push(email);
    });
    return grouped;
  };

  const mapRefToRevs = (pe) => {
    const refToRevMap = new Map();
    pe.forEach((email) => {
      if (email.reviewer !== 'N/A' && email.ref !== 'N/A') {
        refToRevMap.set(email.ref, email.reviewer);
      }
    });
    return refToRevMap;
  };
  
  const parseEmails = () => {
    const parsedEmails = [];
    emails.forEach((email) => {
      // Extract necessary data from each email
      const phaseMatch = email?.subject?.match(/^[^,]*/);
      const refMatch = email?.body?.match(/Starting Ref\s?#:\s*(\d+)/);
      const revMatch = email?.body?.match(/Reviewer:\s*([\w.-]+@[\w.-]+\.\w+)/);
      const dateMatch = email?.date?.match(/\d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2}/);
      const linkMatch = email?.body?.match(/href="([^"]*)" /);

      const phase = phaseMatch ? phaseMatch[0] : 'N/A';
      const ref = refMatch ? refMatch[1] : 'N/A';
      const reviewer = revMatch ? revMatch[1] : 'N/A';
      const date = dateMatch ? dateMatch[0] : 'N/A';
      const link = linkMatch ? linkMatch[1] : 'N/A';
      parsedEmails.push({phase, reviewer, date, ref, link})
    });
    return parsedEmails;
  }

  const displayEmails = () => {
    const pe = parseEmails();
    const groupedEmails = groupEmailsByPhase(pe);
    const refToRevMap = mapRefToRevs(pe);
    return Object.entries(groupedEmails).map(([phase, emails]) => (
      <Box key={phase} sx={{ marginBottom: 2 }}>
        <Typography variant="h6">{phase}</Typography>
        {emails.map((email, index) => (
          <Box key={index} p={2} border={1} borderColor="grey.300" my={1}>
            <Typography>Reveiwer: {refToRevMap.get(email.ref)}</Typography>
            <Typography>Date: {email.date}</Typography>
            <Typography>Ref: {email.ref}</Typography>
            <Typography>Link: {email.link}</Typography>
          </Box>
        ))}
      </Box>
    ));
  };

  return (
    <div>
      <Typography variant="h6">Enter a manuscript to search: </Typography>
      <Box
        component="form"
        sx={{
          '& > :not(style)': { m: 1, width: '25ch' },
        }}
        noValidate
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault(); // Prevent the default form submission behavior
          handleSearch(); // Call the search function
        }}
      >
        <TextField
          label="Search"
          variant="outlined"
          value={searchTerm}
          onChange={handleInputChange}
        />
        <Button variant="outlined" onClick={handleSearch}>
          Search
        </Button>
      </Box>
      {error && <div>Error: {error}</div>}
      {/*searched && emails.map((email, index) => (
        <div key={index}>{email}</div> // Example: Display email subjects
      ))*/}
      {searched && displayEmails()}
    </div>
  );
};

export default EmailComponent;
