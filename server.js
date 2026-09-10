const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname)));

const users = [
    {
        username: 'Muhammed Rashid',
        email: 'entothic@gmail.com',
        password: 'muhammedkr1',
        role: 'admin',
        apiKeys: []
    }
];

let siteData = {
    currency_rates: {
        INR: { symbol: '₹', rate: 1 },
        USD: { symbol: '$', rate: 0.012 },
        EUR: { symbol: '€', rate: 0.011 }
    },
    hosting_plans: {
        minecraft: [
            {
                title: 'Budget Extreme',
                subtitle: 'Ryzen 9 7900X',
                price_inr: 299,
                badge: 'POPULAR',
                button_text: 'ORDER NOW',
                button_link: 'https://discord.gg/47x3SAJhXy',
                specs: [
                    { label: 'RAM', value: '4 GB DDR5' },
                    { label: 'Storage', value: '25 GB NVMe' },
                    { label: 'vCPU', value: '2 Cores' }
                ]
            }
        ],
        discord_bot: [
            {
                title: 'Bot Node',
                subtitle: 'High Uptime',
                price_inr: 99,
                badge: 'POPULAR',
                button_text: 'ORDER NOW',
                button_link: 'https://discord.gg/47x3SAJhXy',
                specs: [
                    { label: 'RAM', value: '1 GB' },
                    { label: 'Storage', value: '10 GB NVMe' },
                    { label: 'vCPU', value: '1 Core' }
                ]
            }
        ],
        vps: [
            {
                title: 'Cloud VPS',
                subtitle: 'Full Root Access',
                price_inr: 499,
                badge: 'BEST VALUE',
                button_text: 'ORDER NOW',
                button_link: 'https://discord.gg/47x3SAJhXy',
                specs: [
                    { label: 'RAM', value: '4 GB' },
                    { label: 'Storage', value: '80 GB NVMe' },
                    { label: 'Bandwidth', value: '2 TB' }
                ]
            }
        ],
        free_bot_hosting: [
            {
                title: 'Community Tier',
                subtitle: 'Always Free',
                price_inr: 0,
                badge: 'FREE',
                button_text: 'DEPLOY',
                button_link: 'https://discord.gg/47x3SAJhXy',
                specs: [
                    { label: 'RAM', value: '512 MB' },
                    { label: 'Storage', value: '2 GB' },
                    { label: 'vCPU', value: '0.5 Core' }
                ]
            }
        ]
    }
};

app.get('/api/data', (req, res) => res.json(siteData));

app.post('/api/login', (req, res) => {
    const { identifier, password } = req.body;
    const user = users.find(u => (u.username === identifier || u.email === identifier) && u.password === password);
    if (user) {
        res.json({ success: true, user: { username: user.username, email: user.email, role: user.role } });
    } else {
        res.status(401).json({ success: false, message: 'Invalid username/email or password.' });
    }
});

app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    if (users.some(u => u.username === username || u.email === email)) {
        return res.status(400).json({ success: false, message: 'Username or email already exists.' });
    }
    const newUser = { username, email, password, role: 'user', apiKeys: [] };
    users.push(newUser);
    res.json({ success: true, user: { username: newUser.username, email: newUser.email, role: newUser.role } });
});

app.post('/api/user/profile', (req, res) => {
    const { currentEmail, newUsername, newEmail, newPassword } = req.body;
    const user = users.find(u => u.email === currentEmail);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (newUsername) user.username = newUsername;
    if (newEmail) user.email = newEmail;
    if (newPassword) user.password = newPassword;

    res.json({ success: true, user: { username: user.username, email: user.email, role: user.role } });
});

app.get('/api/keys/:email', (req, res) => {
    const user = users.find(u => u.email === req.params.email);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, apiKeys: user.apiKeys });
});

app.post('/api/keys', (req, res) => {
    const { email, name, expiration } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const secretKey = `hqc_${crypto.randomBytes(24).toString('hex')}`;
    user.apiKeys.push({
        name: name || 'Default API Key',
        secretKey,
        created: new Date().toLocaleDateString(),
        lastUsed: 'Never',
        expires: expiration || 'No expiration',
        usage: '0 API Calls'
    });
    res.json({ success: true, apiKeys: user.apiKeys });
});

app.delete('/api/keys/:email/:index', (req, res) => {
    const { email, index } = req.params;
    const user = users.find(u => u.email === email);
    if (!user || !user.apiKeys[index]) return res.status(404).json({ success: false, message: 'Key not found' });

    user.apiKeys.splice(index, 1);
    res.json({ success: true, apiKeys: user.apiKeys });
});

app.post('/api/admin/plans', (req, res) => {
    const { category, title, subtitle, price_inr, badge, ram, storage, vcpu } = req.body;
    if (!siteData.hosting_plans[category]) siteData.hosting_plans[category] = [];
    
    siteData.hosting_plans[category].push({
        title,
        subtitle,
        price_inr: Number(price_inr),
        badge: badge ? badge.toUpperCase() : null,
        button_text: price_inr == 0 ? 'DEPLOY' : 'ORDER NOW',
        button_link: 'https://discord.gg/47x3SAJhXy',
        specs: [
            { label: 'RAM', value: ram },
            { label: 'Storage', value: storage },
            { label: 'vCPU', value: vcpu }
        ]
    });
    res.json({ success: true, siteData });
});

app.delete('/api/admin/plans/:category/:index', (req, res) => {
    const { category, index } = req.params;
    if (siteData.hosting_plans[category] && siteData.hosting_plans[category][index]) {
        siteData.hosting_plans[category].splice(index, 1);
        res.json({ success: true, siteData });
    } else {
        res.status(404).json({ success: false, message: 'Plan not found.' });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;