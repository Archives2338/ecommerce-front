import { Component, OnInit, DoCheck } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent implements OnInit, DoCheck {
  email: string = '';
  isLoading: boolean = false;
  isEmailValid: boolean = false;

  // Estados del flujo de autenticación
  currentStep: 'email' | 'verification' | 'login' = 'email';
  showNoAccountModal: boolean = false;

  // Campos para login con contraseña
  password: string = '';
  showPassword: boolean = false;

  // Código de verificación
  verificationCode: string[] = ['', '', '', ''];
  isCodeComplete: boolean = false;

  // Modal para establecer contraseña
  setPasswordDialogVisible: boolean = false;
  setPasswordEmail: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  passwordError: string = '';

  constructor(private router: Router, private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void {
    // Inicialización del componente
    console.log('🔷 ngOnInit - Estado inicial del verificationCode:', [...this.verificationCode]);
    console.log('🔷 ngOnInit - isCodeComplete inicial:', this.isCodeComplete);
  }

  /**
   * Track by function para Angular - asegura que cada input se rastree correctamente
   */
  trackByIndex(index: number, item: any): number {
    return index;
  }

  /**
   * Validación cuando cambie el array - REEMPLAZA onCodeInput
   */
  ngDoCheck(): void {
    // Validar que solo números y un dígito
    let hasChanges = false;
    for (let i = 0; i < this.verificationCode.length; i++) {
      let value = this.verificationCode[i];
      if (value && !/^[0-9]$/.test(value)) {
        console.log(`🟡 Corrigiendo valor inválido en índice ${i}: "${value}"`);
        this.verificationCode[i] = '';
        hasChanges = true;
      }
      if (value && value.length > 1) {
        console.log(`🟡 Corrigiendo valor largo en índice ${i}: "${value}"`);
        this.verificationCode[i] = value.slice(-1);
        hasChanges = true;
      }
    }
    
    // FORZAR re-render si hay cambios
    if (hasChanges) {
      console.log('🔄 Forzando re-render por cambios detectados');
      this.verificationCode = [...this.verificationCode]; // Nueva referencia
    }
    
    this.updateCodeComplete();
  }

  /**
   * Valida el formato del email
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Actualiza la validación del email cuando cambia
   */
  onEmailChange(): void {
    this.isEmailValid = this.validateEmail(this.email);
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (!this.isEmailValid || this.isLoading) return;
    this.isLoading = true;
    this.http.post<any>('http://localhost:3000/api/customer/auth/check-email', { email: this.email })
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.code === 0 && res.message === 'Email no registrado.') {
            this.showNoAccountModal = true;
          } 
            // Email existe, mostrar formulario de login con contraseña
           else {
            this.currentStep = 'login';

          }
        },
        error: () => {
          this.isLoading = false;
          alert('Error de red');
        }
      });
  }

  /**
   * Maneja el login con contraseña
   */
  onPasswordLogin(): void {
    if (!this.password || this.isLoading) return;
    
    this.isLoading = true;
    this.http.post<any>('http://localhost:3000/api/customer/auth/login', {
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.code === 0 || res.statusCode === 200) {
          // Login exitoso - usar AuthService para manejar el estado
          this.authService.processLoginSuccess(res.data);
          alert('Login exitoso');
          // Redirigir según la respuesta
          if (res.redirect_url) {
            this.router.navigate([res.redirect_url]);
          } else {
            this.router.navigate(['/']);
          }
        } else {
          alert(res.message || 'Credenciales incorrectas');
        }
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error && err.error.message) {
          alert(err.error.message);
        } else {
          alert('Error de red o login');
        }
      }
    });
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Vuelve al paso de email desde login
   */
  goBackToEmailFromLogin(): void {
    this.currentStep = 'email';
    this.password = '';
  }

  /**
   * Login con Google
   */
  loginGoogle(): void {
    console.log('Iniciando login con Google');
    this.showTemporaryMessage('Login con Google - Funcionalidad en desarrollo');
  }

  /**
   * Login con Facebook
   */
  loginFacebook(): void {
    console.log('Iniciando login con Facebook');
    this.showTemporaryMessage('Login con Facebook - Funcionalidad en desarrollo');
  }

  /**
   * Login con Apple
   */
  loginApple(): void {
    console.log('Iniciando login con Apple');
    this.showTemporaryMessage('Login con Apple - Funcionalidad en desarrollo');
  }

  /**
   * Navega de vuelta al home
   */
  goHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Cierra el modal de cuenta no encontrada
   */
  closeNoAccountModal(): void {
    this.showNoAccountModal = false;
  }

  /**
   * Maneja el registro desde el modal
   */
  handleSignUp(): void {
    this.isLoading = true;
    this.http.post<any>('http://localhost:3000/api/customer/auth/send-code', { email: this.email })
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.closeNoAccountModal();
          if (res.code === 0) {
            this.currentStep = 'verification';
            this.initializeOTPFields();
          } else {
            alert(res.message || 'Error al enviar código');
          }
        },
        error: () => {
          this.isLoading = false;
          alert('Error de red');
        }
      });
  }

  /**
   * Inicializa los campos OTP limpios
   */
  initializeOTPFields(): void {
    this.verificationCode = ['', '', '', ''];
    this.isCodeComplete = false;
    
    setTimeout(() => {
      for (let i = 0; i < 4; i++) {
        const input = document.querySelector(`#simple-otp-${i}`) as HTMLInputElement;
        if (input) {
          input.value = '';
        }
      }
      
      const firstInput = document.querySelector('#simple-otp-0') as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  /**
   * Detecta clicks del usuario (acciones manuales)
   */
  onCodeClick(index: number, event: any): void {
    this.lastUserAction = Date.now();
    console.log(`👆 CLICK manual en índice ${index}`);
  }

  /**
   * Detecta cuando un campo OTP recibe focus
   */
  onCodeFocus(index: number, event: any): void {
    console.log(`🔵 FOCUS detectado en índice ${index}`);
    
    // Si no es el focus esperado (usuario hizo click), cancelarlo
    const now = Date.now();
    if (!this.lastUserAction || (now - this.lastUserAction) > 100) {
      console.log(`🚫 FOCUS automático detectado en índice ${index} - CANCELANDO`);
      // Permitimos que se mantenga pero registramos el evento
    }
  }

  /**
   * Detecta cuando un campo OTP pierde focus
   */
  onCodeBlur(index: number, event: any): void {
    console.log(`🔴 BLUR detectado en índice ${index}`);
  }

  // Variable para rastrear acciones del usuario
  private lastUserAction: number = 0;

  /**
   * Actualiza el estado de código completo
   */
  private updateCodeComplete(): void {
    this.isCodeComplete = this.verificationCode.every(digit => digit !== '');
  }

  /**
   * Maneja el borrado en los campos de código
   */
  onCodeKeydown(index: number, event: KeyboardEvent): void {
    this.lastUserAction = Date.now(); // Registrar acción manual
    console.log(`🔴 KeyDown en índice ${index}, tecla: "${event.key}"`);
    
    const input = event.target as HTMLInputElement;
    
    if (event.key === 'Backspace') {
      if (!input.value && index > 0) {
        event.preventDefault();
        const prevInput = document.querySelector(`#simple-otp-${index - 1}`) as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
          prevInput.select();
          console.log(`🔴 Moviendo focus ATRÁS al índice ${index - 1}`);
        }
      } else if (input.value) {
        event.preventDefault();
        this.verificationCode[index] = '';
        input.value = '';
        this.updateCodeComplete();
        console.log(`🔴 Borrando valor en índice ${index}`);
      }
    }
    
    // PREVENIR auto-avance después de escribir
    if (event.key.length === 1 && /[0-9]/.test(event.key)) {
      console.log(`🟡 Tecla número detectada: ${event.key}`);
      // NO hacer nada especial, dejar que ngModel lo maneje
    }
  }

  /**
   * Maneja el pegado de código completo
   */
  onCodePaste(index: number, event: ClipboardEvent): void {
    event.preventDefault();
    
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 4);
    
    if (digits.length > 0) {
      for (let i = 0; i < 4; i++) {
        if (i < digits.length) {
          this.verificationCode[i] = digits[i];
          const input = document.querySelector(`#simple-otp-${i}`) as HTMLInputElement;
          if (input) {
            input.value = digits[i];
          }
        }
      }
      this.updateCodeComplete();
    }
  }

  /**
   * Verifica el código de verificación
   */
  verifyCode(): void {
    if (!this.isCodeComplete) {
      return;
    }

    const code = this.verificationCode.join('');
    console.log('Verificando código:', code);
    this.isLoading = true;
    this.http.post<any>('http://localhost:3000/api/customer/auth/verify-code', {
      email: this.email,
      code: code
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.code === 0 && res.type === 'success') {
          // Código verificado correctamente, abrir modal para establecer contraseña
          this.setPasswordEmail = this.email;
          this.setPasswordDialogVisible = true;
        } else {
          // Código inválido o expirado
          console.log('Código incorrecto o expirado');
          alert(res.message || 'Código incorrecto, intenta de nuevo');
        }
      },
      error: () => {
        this.isLoading = false;
        alert('Error de red');
      }
    });
  }

  canContinue(): boolean {
    return (
      this.newPassword.length >= 8 &&
      this.newPassword.length <= 20 &&
      /[A-Za-z]/.test(this.newPassword) &&
      /[0-9]/.test(this.newPassword) &&
      this.newPassword === this.confirmPassword
    );
  }

  onSetPassword(): void {
    if (!this.canContinue()) {
      this.passwordError = 'La contraseña no cumple los requisitos.';
      return;
    }
    this.isLoading = true;
    this.passwordError = '';
    this.http.post<any>('http://localhost:3000/api/customer/auth/complete-registration', {
      email: this.setPasswordEmail,
      password: this.newPassword,
      firstName: 'usuario',
      lastName: 'usuario'
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.code === 0 || res.statusCode === 200) {
          // Registro exitoso - usar AuthService para manejar el estado
          this.authService.processLoginSuccess(res.data);
          alert('Registro completado correctamente');
          this.setPasswordDialogVisible = false;
          // Redirigir según la respuesta, si existe
          if (res.redirect_url) {
            this.router.navigate([res.redirect_url]);
          } else {
            this.router.navigate(['/']);
          }
        } else if (res.message) {
          // Puede ser un array de errores o string
          if (Array.isArray(res.message)) {
            this.passwordError = res.message.join(' ');
          } else {
            this.passwordError = res.message;
          }
        } else {
          this.passwordError = 'Error desconocido en el registro.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error && err.error.message) {
          if (Array.isArray(err.error.message)) {
            this.passwordError = err.error.message.join(' ');
          } else {
            this.passwordError = err.error.message;
          }
        } else {
          this.passwordError = 'Error de red o registro.';
        }
      }
    });
  }

  /**
   * Reenvía el código de verificación
   */
  resendCode(): void {
    console.log('Reenviando código a:', this.email);
    this.initializeOTPFields();
    alert('Código reenviado a ' + this.email);
  }

  /**
   * Vuelve al paso anterior
   */
  goBackToEmail(): void {
    this.currentStep = 'email';
    this.initializeOTPFields();
  }

  /**
   * Muestra un mensaje temporal para desarrollo
   */
  private showTemporaryMessage(message: string): void {
    alert(message);
  }

  /**
   * Mueve el foco al siguiente input OTP al ingresar un dígito
   */
  focusNextOtp(index: number, event: any): void {
    const value = event.target.value;
    // Solo avanzar si se ingresó un dígito válido y no está vacío
    if (value && /^[0-9]$/.test(value) && index < this.verificationCode.length - 1) {
      const nextInput = document.querySelector(`#simple-otp-${index + 1}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  }
}
