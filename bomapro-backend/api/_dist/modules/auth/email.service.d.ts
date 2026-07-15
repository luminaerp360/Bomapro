export declare class EmailService {
    private transporter;
    constructor();
    sendVerificationEmail(to: string, name: string, token: string): Promise<void>;
    sendApprovalNotification(to: string, name: string): Promise<void>;
    sendNewUserNotificationToAdmin(adminEmail: string, newUserName: string, newUserEmail: string): Promise<void>;
    sendInvitationEmail(to: string, name: string, organizationName: string, tempPassword?: string): Promise<void>;
}
