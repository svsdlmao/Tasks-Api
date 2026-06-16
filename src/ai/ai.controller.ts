import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiHelpDto } from './dto/ai-help.dto';

@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('help')
  async help(@Body() dto: AiHelpDto) {
    return this.aiService.getHelp(dto);
  }

  
  async downloadDb(){

  }
}
