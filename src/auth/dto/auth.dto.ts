export class RegisterDto {
  fullName: string;
  email: string;
  password: string;
  role?: string;
}

export class LoginDto {
  email: string;
  password: string;
}

export class AuthResponseDto {
  accessToken: string;
  userId: string;
  email: string;
  role: string;
}
