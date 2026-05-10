const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.matchUsersAI = async (users, currentUser) => {
  const prompt = `
  Current user:
  Offers: ${currentUser.skillsOffered}
  Wants: ${currentUser.skillsWanted}

  Other users:
  ${users.map(u => `
    Name: ${u.name}
    Offers: ${u.skillsOffered}
    Wants: ${u.skillsWanted}
  `).join("\n")}

  Suggest top 3 matches for skill exchange.
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }]
  });

  return response.choices[0].message.content;
};