# ColorBot Alexa Skill 🎨

An Alexa skill that creates custom coloring pages for children using voice commands and AI image generation.

## Features

- **Voice-Activated**: "Alexa, print me a dinosaur to color!"
- **Bilingual Support**: Works in English and Spanish
- **Direct Printing**: Prints to Alexa-connected printers
- **SMS Delivery**: Sends image links via text message
- **AI-Generated**: Uses OpenAI to create custom coloring pages
- **Kid-Friendly**: Safe, appropriate content for children

## Quick Start

### Prerequisites

- AWS Account with appropriate permissions
- Amazon Developer Account
- OpenAI API key
- Phone number for SMS notifications

### Environment Variables

```bash
export AWS_ACCOUNT_ID="123456789012"
export OPENAI_API_KEY="sk-..."
export S3_BUCKET_NAME="my-coloring-bucket"
export SMS_PHONE_NUMBER="+1234567890"
```

### Deployment

1. **Clone and Setup**
   ```bash
   git clone <repository>
   cd colorbot-alexa-skill
   ```

2. **Deploy AWS Infrastructure**
   ```bash
   cd deployment
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Create Alexa Skill**
   - Go to [Amazon Developer Console](https://developer.amazon.com/alexa/console/ask)
   - Create new skill named "ColorBot"
   - Set endpoint to your Lambda ARN
   - Upload interaction models from `alexa-skill/interactionModels/`

4. **Test the Skill**
   - Enable skill in Alexa app
   - Say: "Alexa, ask ColorBot to print me a unicorn"

## Architecture

```
Voice Request → Alexa → AWS Lambda (Cloud) → OpenAI API → Generated Image
                  ↓              ↓
               Print Job        S3 Storage
                  ↓              ↓
              Connected      SMS with Link
               Printer
```

## Sample Voice Commands

### English
- "Alexa, ask ColorBot to print me a dinosaur to color"
- "Alexa, tell ColorBot I want a unicorn"
- "Alexa, ask ColorBot for a butterfly"

### Spanish
- "Alexa, pide a ColorBot que imprima un dinosaurio para colorear"
- "Alexa, dile a ColorBot que quiero un unicornio"
- "Alexa, pide a ColorBot una mariposa"

## Supported Subjects

Animals: dinosaur, unicorn, dragon, butterfly, cat, dog, bird
Objects: car, airplane, boat, house, tree, flower, castle
Characters: princess, prince, superhero, robot, monster, alien

## Error Handling

The skill gracefully handles:
- No printer connected (SMS-only mode)
- Image generation failures
- SMS delivery issues
- Invalid voice requests

## Cost Optimization

- Uses AWS Free Tier resources where possible
- Optimized OpenAI prompts for cost efficiency
- Efficient S3 storage with lifecycle policies
- Minimal Lambda execution time

## Privacy & Safety

- Child-directed skill with appropriate content filtering
- No personal data collection beyond necessary functionality
- COPPA compliant
- Safe, family-friendly image generation

## Development

### Local Testing
```bash
npm run dev
```

### Skill Testing Interface
The web dashboard provides a testing interface to simulate voice commands and monitor skill performance.

### Lambda Logs
```bash
aws logs tail /aws/lambda/colorbot-alexa-skill --follow
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the troubleshooting guide in the documentation
- Review AWS CloudWatch logs
- Test with the built-in skill tester

---

Built with ❤️ for creative kids and families