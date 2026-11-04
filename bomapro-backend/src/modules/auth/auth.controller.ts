import { Controller, Post, Body, Get, Put, Delete, Param, UseGuards, Req, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, UpdateUserDto, InviteUserDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ALL_PERMISSIONS, DEFAULT_ADMIN_PERMISSIONS, DEFAULT_AGENT_PERMISSIONS, DEFAULT_MANAGER_PERMISSIONS } from './schemas/rentium-user.schema';
import { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  register(@Body() dto: RegisterDto, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.authService.register(dto, tenantId);
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  inviteUser(@Body() dto: InviteUserDto, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.authService.inviteUser(dto, tenantId, req.user);
  }

  @Post('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createUser(@Body() dto: InviteUserDto, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.authService.inviteUser(dto, tenantId, req.user);
  }

  @Post('set-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  setPassword(@Req() req, @Body('password') password: string) {
    return this.authService.setPassword(req.user.sub, password);
  }

  @Post('signup')
  signup(@Body() dto: { name: string; email: string; password: string }) {
    return this.authService.signup(dto);
  }

  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4400';

    if (result.error) {
      return res.redirect(`${frontendUrl}/login?error=${result.error}&message=${encodeURIComponent(result.message)}`);
    }

    const token = (result as any).token;
    const user = encodeURIComponent(JSON.stringify((result as any).user));
    const tenants = encodeURIComponent(JSON.stringify((result as any).tenants || []));
    const activeTenantId = (result as any).activeTenantId || '';
    return res.redirect(`${frontendUrl}/login?token=${token}&user=${user}&tenants=${tenants}&activeTenantId=${activeTenantId}`);
  }

  @Put('users/:id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  approveUser(@Param('id') id: string, @Req() req) {
    return this.authService.approveUser(id, req.user);
  }

  @Put('users/:id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  rejectUser(@Param('id') id: string, @Req() req) {
    return this.authService.rejectUser(id, req.user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getProfile(@Req() req) {
    return this.authService.getProfile(req.user.sub);
  }

  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getPermissions() {
    return {
      all: ALL_PERMISSIONS,
      defaults: {
        admin: DEFAULT_ADMIN_PERMISSIONS,
        manager: DEFAULT_MANAGER_PERMISSIONS,
        agent: DEFAULT_AGENT_PERMISSIONS,
      },
    };
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getUsers(
    @Req() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    const tenantId = req.user?.tenantId || '';
    return this.authService.getUsers(page, limit, search, tenantId, req.user);
  }

  @Get('users/search-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  searchAllUsers(@Query('q') query: string, @Req() req) {
    return this.authService.searchAllUsers(query, req.user);
  }

  @Get('tenants/:tenantId/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getTenantMembers(@Param('tenantId') tenantId: string, @Req() req) {
    return this.authService.getTenantMembers(tenantId, req.user);
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getUserById(@Param('id') id: string, @Req() req) {
    return this.authService.getUserById(id, req.user);
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req) {
    return this.authService.updateUser(id, dto, req.user);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteUser(@Param('id') id: string, @Req() req) {
    return this.authService.deleteUser(id, req.user);
  }

  @Post('switch-tenant')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  switchTenant(@Req() req, @Body('tenantId') tenantId: string) {
    return this.authService.switchTenant(req.user.sub, tenantId);
  }

  @Post('users/:id/add-to-tenant')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  addUserToTenant(@Param('id') userId: string, @Body('tenantId') tenantId: string, @Req() req) {
    return this.authService.addUserToTenant(userId, tenantId, req.user);
  }

  @Post('users/:id/remove-from-tenant')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  removeUserFromTenant(@Param('id') userId: string, @Body('tenantId') tenantId: string, @Req() req) {
    return this.authService.removeUserFromTenant(userId, tenantId, req.user);
  }
}
