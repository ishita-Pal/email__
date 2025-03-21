const { client } = require('../config/elasticsearch'); 


const indexEmail = async (req, res) => {
    try {
        const { sender, subject, body, received_at } = req.body;

        const email = {
            sender,
            subject,
            body,
            received_at: received_at || new Date().toISOString()
        };

        await client.index({
            index: 'emails',
            body: email
        });

        res.status(201).json({ message: "Email indexed successfully", email });
    } catch (error) {
        console.error('Indexing error:', error);
        res.status(500).json({ message: "Error indexing email", error });
    }
};


const searchEmails = async (req, res) => {
    try {
        const { query } = req.query;

        const result = await client.search({
            index: 'emails',
            body: {
                query: {
                    match: { subject: query }
                }
            }
        });

        res.status(200).json({ results: result.body.hits.hits.map(hit => hit._source) });
    } catch (error) {
        console.error(' Search error:', error);
        res.status(500).json({ message: "Error searching emails", error });
    }
};

module.exports = { indexEmail, searchEmails };
