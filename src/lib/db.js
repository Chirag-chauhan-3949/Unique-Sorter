import { randomUUID } from 'crypto';

// Shared in-memory database for backend
// Data stored here FIRST, then synced to Firebase

class Database {
  constructor() {
    this.users = [];
    this.otps = new Map();
    this.inquiries = [];
  }

  // User methods
  findUserByPhone(phone) {
    return this.users.find(user => user.phone === phone);
  }

  createUser(userData) {
    const user = {
      id: randomUUID(),
      ...userData,
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    console.log('User created in backend:', user.phone);
    return user;
  }

  validateUser(phone) {
    const user = this.findUserByPhone(phone);
    if (!user) return null;
    return user;
  }

  // OTP methods
  storeOtp(phone, otp) {
    this.otps.set(phone, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });
    console.log('OTP stored in backend for:', phone);
  }

  getOtp(phone) {
    return this.otps.get(phone);
  }

  deleteOtp(phone) {
    this.otps.delete(phone);
  }

  // Inquiry methods
  createInquiry(inquiryData) {
    const inquiry = {
      id: randomUUID(),
      ...inquiryData,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    this.inquiries.push(inquiry);
    console.log('Inquiry created in backend:', inquiry.id);
    return inquiry;
  }

  getAllInquiries() {
    return this.inquiries;
  }
}

// Export singleton instance
const db = new Database();
export default db;
