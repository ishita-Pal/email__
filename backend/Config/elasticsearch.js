const { Client } = require('@elastic/elasticsearch');

const client = new Client({
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    ssl: { rejectUnauthorized: false }
});


client.ping()
    .then(() => console.log('Connected to Elasticsearch'))
    .catch(err => console.error('Elasticsearch Connection Error:', err));
    const indexEmail = async (emailData) => {
        try {
            console.log("Attempting to index email:", JSON.stringify(emailData, null, 2)); 
    
            const response = await client.index({
                index: 'emails',
                body: emailData
            });
            console.log("Email indexed successfully!", response);
        } catch (error) {
            console.error('Elasticsearch Indexing Error:', error);
        }
    };
    const searchEmails = async (req, res) => {
        try {
            const { query } = req.query;
    
            const result = await client.search({
                index: 'emails',
                body: {
                    query: {
                        match: {
                            subject: query
                        }
                    }
                }
            });
    
            const emails = result.body.hits.hits.map(hit => hit._source);
            res.status(200).json({ results: emails });
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).json({ message: "Error searching emails", error });
        }
    };
        
module.exports = { client, indexEmail };
