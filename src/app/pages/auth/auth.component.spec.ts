import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthComponent } from './auth.component';
import { Router } from '@angular/router';

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [AuthComponent],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate email correctly', () => {
    expect(component.validateEmail('test@example.com')).toBeTruthy();
    expect(component.validateEmail('invalid-email')).toBeFalsy();
    expect(component.validateEmail('')).toBeFalsy();
  });

  it('should handle form submission when email is valid', () => {
    component.email = 'test@example.com';
    component.isEmailValid = true;
    component.isLoading = false;

    spyOn(console, 'log');
    component.onSubmit();

    expect(component.isLoading).toBeTruthy();
    expect(console.log).toHaveBeenCalledWith('Procesando login con email:', 'test@example.com');
  });

  it('should not submit when email is invalid', () => {
    component.email = 'invalid-email';
    component.isEmailValid = false;

    spyOn(console, 'log');
    component.onSubmit();

    expect(component.isLoading).toBeFalsy();
    expect(console.log).not.toHaveBeenCalled();
  });

  it('should handle social login methods', () => {
    spyOn(console, 'log');
    spyOn(window, 'alert');

    component.loginGoogle();
    expect(console.log).toHaveBeenCalledWith('Iniciando login con Google');

    component.loginFacebook();
    expect(console.log).toHaveBeenCalledWith('Iniciando login con Facebook');

    component.loginApple();
    expect(console.log).toHaveBeenCalledWith('Iniciando login con Apple');
  });
});
