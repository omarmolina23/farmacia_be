import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { RunAiDto } from './dto/run-ai.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @UseGuards(AuthGuard)
  @Post('run')
  run(@Body() runAiDto: RunAiDto) {
    return this.aiService.run(runAiDto);
  }
}
