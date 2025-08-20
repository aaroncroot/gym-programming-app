const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // For development, we'll use a mock transporter that logs emails
    // In production, you'd configure with real email credentials
    this.transporter = {
      sendMail: async (options) => {
        console.log('📧 EMAIL SENT:');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Content:', options.html || options.text);
        console.log('---');
        
        // In production, this would actually send the email
        return { messageId: 'mock-message-id' };
      }
    };
  }

  async sendVerificationEmail(user, verificationToken) {
    const verificationUrl = `http://localhost:3000/verify-email?token=${verificationToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 2rem; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem;">Welcome to Gym Programming App!</h1>
        </div>
        
        <div style="padding: 2rem; background: #f8f9fa;">
          <h2 style="color: #2c3e50;">Hi ${user.firstName}!</h2>
          
          <p style="color: #34495e; font-size: 1.1rem; line-height: 1.6;">
            Thank you for registering with our gym programming platform. We're excited to have you on board!
          </p>
          
          <div style="background: white; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; border-left: 4px solid #3498db;">
            <h3 style="color: #2c3e50; margin-top: 0;">What happens next?</h3>
            <ul style="color: #34495e; line-height: 1.8;">
              <li>✅ Click the verification link below to activate your account</li>
              ${user.role === 'client' ? '<li>👨‍💼 Your selected trainer will receive a notification</li><li>⏳ Wait for trainer approval to access your account</li>' : ''}
              <li> Once approved, you can log in and start using the app</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 2rem 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #27ae60, #229954); color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Verify Your Email
            </a>
          </div>
          
          <p style="color: #7f8c8d; font-size: 0.9rem;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #3498db;">${verificationUrl}</a>
          </p>
          
          <p style="color: #7f8c8d; font-size: 0.9rem;">
            This link will expire in 24 hours for security reasons.
          </p>
        </div>
        
        <div style="background: #2c3e50; color: white; padding: 1rem; text-align: center; font-size: 0.9rem;">
          <p>© 2024 Gym Programming App. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.transporter.sendMail({
      to: user.email,
      subject: 'Verify Your Email - Gym Programming App',
      html: html
    });
  }

  async sendTrainerNotification(trainer, client) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; padding: 2rem; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem;">New Client Request</h1>
        </div>
        
        <div style="padding: 2rem; background: #f8f9fa;">
          <h2 style="color: #2c3e50;">Hi ${trainer.firstName}!</h2>
          
          <p style="color: #34495e; font-size: 1.1rem; line-height: 1.6;">
            You have a new client request waiting for your approval.
          </p>
          
          <div style="background: white; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; border-left: 4px solid #e74c3c;">
            <h3 style="color: #2c3e50; margin-top: 0;">Client Details:</h3>
            <p><strong>Name:</strong> ${client.firstName} ${client.lastName}</p>
            <p><strong>Email:</strong> ${client.email}</p>
            <p><strong>Location:</strong> ${client.location?.city}, ${client.location?.country}</p>
            <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="text-align: center; margin: 2rem 0;">
            <a href="http://localhost:3000/trainer/dashboard" 
               style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Review Client Request
            </a>
          </div>
          
          <p style="color: #7f8c8d; font-size: 0.9rem;">
            Log into your dashboard to approve or reject this client request.
          </p>
        </div>
        
        <div style="background: #2c3e50; color: white; padding: 1rem; text-align: center; font-size: 0.9rem;">
          <p>© 2024 Gym Programming App. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.transporter.sendMail({
      to: trainer.email,
      subject: 'New Client Request - Gym Programming App',
      html: html
    });
  }

  async sendWelcomeEmail(user) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #27ae60, #229954); color: white; padding: 2rem; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem;">Welcome to Gym Programming App!</h1>
        </div>
        
        <div style="padding: 2rem; background: #f8f9fa;">
          <h2 style="color: #2c3e50;">Hi ${user.firstName}!</h2>
          
          <p style="color: #34495e; font-size: 1.1rem; line-height: 1.6;">
            Your account has been successfully verified and approved! You can now log in and start using the app.
          </p>
          
          <div style="background: white; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; border-left: 4px solid #27ae60;">
            <h3 style="color: #2c3e50; margin-top: 0;">Getting Started:</h3>
            <ul style="color: #34495e; line-height: 1.8;">
              <li>🎯 Log into your account</li>
              <li>📋 Explore your personalized dashboard</li>
              <li> Start your fitness journey</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 2rem 0;">
            <a href="http://localhost:3000/login" 
               style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Log In Now
            </a>
          </div>
        </div>
        
        <div style="background: #2c3e50; color: white; padding: 1rem; text-align: center; font-size: 0.9rem;">
          <p>© 2024 Gym Programming App. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.transporter.sendMail({
      to: user.email,
      subject: 'Welcome to Gym Programming App!',
      html: html
    });
  }

  async sendClientApprovalEmail(client, trainer) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #27ae60, #229954); color: white; padding: 2rem; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem;">Account Approved!</h1>
        </div>
        
        <div style="padding: 2rem; background: #f8f9fa;">
          <h2 style="color: #2c3e50;">Hi ${client.firstName}!</h2>
          
          <p style="color: #34495e; font-size: 1.1rem; line-height: 1.6;">
            Great news! Your trainer, ${trainer.firstName} ${trainer.lastName}, has approved your account request.
          </p>
          
          <div style="background: white; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; border-left: 4px solid #27ae60;">
            <h3 style="color: #2c3e50; margin-top: 0;">Your Account is Now Active!</h3>
            <ul style="color: #34495e; line-height: 1.8;">
              <li>✅ Your account has been approved</li>
              <li>👨‍💼 You're now connected with ${trainer.firstName} ${trainer.lastName}</li>
              <li> You can now log in and access your programs</li>
              <li> Start your fitness journey with your trainer</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 2rem 0;">
            <a href="http://localhost:3000/login" 
               style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Log In Now
            </a>
          </div>
          
          <p style="color: #7f8c8d; font-size: 0.9rem;">
            If you have any questions, please contact your trainer directly.
          </p>
        </div>
        
        <div style="background: #2c3e50; color: white; padding: 1rem; text-align: center; font-size: 0.9rem;">
          <p>© 2024 Gym Programming App. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.transporter.sendMail({
      to: client.email,
      subject: 'Account Approved - Gym Programming App',
      html: html
    });
  }

  async sendClientRejectionEmail(client) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; padding: 2rem; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem;">Account Request Update</h1>
        </div>
        
        <div style="padding: 2rem; background: #f8f9fa;">
          <h2 style="color: #2c3e50;">Hi ${client.firstName}!</h2>
          
          <p style="color: #34495e; font-size: 1.1rem; line-height: 1.6;">
            We wanted to let you know that your account request has not been approved by the selected trainer.
          </p>
          
          <div style="background: white; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; border-left: 4px solid #e74c3c;">
            <h3 style="color: #2c3e50; margin-top: 0;">What This Means:</h3>
            <ul style="color: #34495e; line-height: 1.8;">
              <li>❌ Your account request was not approved</li>
              <li>🔄 You can try registering with a different trainer</li>
              <li>📧 Contact the trainer directly for more information</li>
              <li>💡 Consider reaching out to other trainers in your area</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 2rem 0;">
            <a href="http://localhost:3000/register" 
               style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Try Another Trainer
            </a>
          </div>
          
          <p style="color: #7f8c8d; font-size: 0.9rem;">
            Don't give up! There are many great trainers available. Feel free to try registering with a different trainer.
          </p>
        </div>
        
        <div style="background: #2c3e50; color: white; padding: 1rem; text-align: center; font-size: 0.9rem;">
          <p>© 2024 Gym Programming App. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.transporter.sendMail({
      to: client.email,
      subject: 'Account Request Update - Gym Programming App',
      html: html
    });
  }
}

module.exports = new EmailService(); 