
const testApi = async () => {
    try {
        const res = await fetch('http://localhost:3000/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', lang: 'kk' }),
        });

        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Content-Type:', res.headers.get('content-type'));
        console.log('Body snippet:', text.substring(0, 500));

        try {
            JSON.parse(text);
            console.log('Successfully parsed as JSON');
        } catch (e) {
            console.log('Failed to parse as JSON:', e.message);
        }
    } catch (e) {
        console.error('Fetch error:', e.message);
    }
}

testApi();
