import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller()
export class AppController {
  @Get()
  redirectToUi(@Res() res: Response) {
    const target = process.env.APP_ROOT_REDIRECT_URL ?? 'http://localhost:8081';
    return res.redirect(302, target);
  }
}
