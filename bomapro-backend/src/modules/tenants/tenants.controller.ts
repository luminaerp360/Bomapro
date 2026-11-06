import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Inject, forwardRef, ForbiddenException,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthService } from '../auth/auth.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
  ) {}

  @Post()
  async create(@Body() dto: CreateTenantDto, @Req() req) {
    const tenant = await this.tenantsService.create(dto, req.user.sub);
    const tenantId = tenant._id.toString();
    await this.authService.addUserToTenant(req.user.sub, tenantId, req.user);
    return tenant;
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get('my-tenants')
  getMyTenants(@Req() req) {
    const tenantIds = req.user.tenantIds || [];
    if (tenantIds.length === 0) return [];
    return this.tenantsService.findByIds(tenantIds);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    if (req.user.role !== 'super_admin' && !(req.user.tenantIds || []).includes(id)) {
      throw new ForbiddenException('You do not have access to this organization');
    }
    return this.tenantsService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto, @Req() req) {
    if (req.user.role !== 'super_admin' && !(req.user.tenantIds || []).includes(id)) {
      throw new ForbiddenException('You do not have access to this organization');
    }
    return this.tenantsService.update(id, dto);
  }

  @Post(':id/test-email')
  sendTestEmail(@Param('id') id: string, @Body('email') email: string, @Req() req) {
    if (req.user.role !== 'super_admin' && !(req.user.tenantIds || []).includes(id)) {
      throw new ForbiddenException('You do not have access to this organization');
    }
    return this.tenantsService.sendTestEmail(id, email);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
