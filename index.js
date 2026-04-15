require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const axios = require('axios');
const fs = require('fs');

function enhanceText(input) {
  // Basic emotional enhancer for Eleven v3

  const flirtyPrefixes = [
    "[whispering] [flirty]",
    "[softly] [playful]",
    "[happy] [teasing]",
    "[gentle laugh]"
  ];

  const endings = [
    "[chuckles]",
    "[soft laugh]",
    "[giggles]",
    ""
  ];

  // Random selection
  const prefix =
    flirtyPrefixes[Math.floor(Math.random() * flirtyPrefixes.length)];

  const ending =
    endings[Math.floor(Math.random() * endings.length)];

  return `${prefix} ${input} ${ending}`;
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
new SlashCommandBuilder()
  .setName('speak2')
  .setDescription('Generate a voice message')
  .addStringOption(option =>
    option.setName('voice')
      .setDescription('Choose the voice')
      .setRequired(true)
      .addChoices(
        { name: 'Felicity', value: 'felicity' },
        { name: 'Clovis', value: 'clovis' }
      ))
  .addStringOption(option =>
    option.setName('text')
      .setDescription('What the bot should say')
      .setRequired(true)
  )
    
].map(command => command.toJSON());

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('Slash command /speak registered');
  } catch (error) {
    console.error(error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'speak2') return;

await interaction.deferReply();

const rawText = interaction.options.getString('text');
const text = enhanceText(rawText);

const voiceOption = interaction.options.getString('voice');

let selectedVoiceId;

if (voiceOption === 'clovis') {
  selectedVoiceId = process.env.CLOVIS_VOICE_ID;
} else {
  selectedVoiceId = process.env.VOICE_ID;
}


  

  try {
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      data: {
  text,
model_id: voiceOption === 'clovis' ? 'eleven_multilingual_v2' : 'eleven_v3',
  voice_settings: {
    stability: 0.4,
    similarity_boost: 0.85,
    style: 0.6,
    use_speaker_boost: true
  }
},
      responseType: 'arraybuffer'
    });

    fs.writeFileSync('output.mp3', response.data);

    await interaction.editReply({
      content: "Here's your audio:",
      files: ['output.mp3']
    });
  } catch (error) {
    console.error(error);
    await interaction.editReply('Error generating voice.');
  }
});

client.login(process.env.DISCORD_TOKEN);
