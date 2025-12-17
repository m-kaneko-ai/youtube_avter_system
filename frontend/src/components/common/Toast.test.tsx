import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toast, toast } from './Toast';

describe('Toast Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should render success toast', () => {
    render(<Toast message="Success message" type="success" onClose={mockOnClose} />);

    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should render error toast', () => {
    render(<Toast message="Error message" type="error" onClose={mockOnClose} />);

    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should render warning toast', () => {
    render(<Toast message="Warning message" type="warning" onClose={mockOnClose} />);

    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('should render info toast by default', () => {
    render(<Toast message="Info message" onClose={mockOnClose} />);

    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<Toast message="Test message" type="info" onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    vi.advanceTimersByTime(300);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should auto-close after duration', async () => {
    render(<Toast message="Test message" type="info" duration={2000} onClose={mockOnClose} />);

    await vi.runAllTimersAsync();

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should apply correct background color for each type', () => {
    const { container: successContainer } = render(
      <Toast message="Success" type="success" onClose={mockOnClose} />
    );
    expect(successContainer.querySelector('.bg-green-50')).toBeInTheDocument();

    successContainer.remove();

    const { container: errorContainer } = render(
      <Toast message="Error" type="error" onClose={mockOnClose} />
    );
    expect(errorContainer.querySelector('.bg-red-50')).toBeInTheDocument();
  });
});

describe('toast utility', () => {
  beforeEach(() => {
    // Reset toast state
    const state = toast.getState();
    state.toasts.forEach((t) => toast.remove(t.id));
  });

  it('should add toast to state', () => {
    const id = toast.show('Test message', 'info');

    const state = toast.getState();
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].message).toBe('Test message');
    expect(state.toasts[0].type).toBe('info');
    expect(state.toasts[0].id).toBe(id);
  });

  it('should add success toast', () => {
    toast.success('Success message');

    const state = toast.getState();
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].type).toBe('success');
  });

  it('should add error toast', () => {
    toast.error('Error message');

    const state = toast.getState();
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].type).toBe('error');
  });

  it('should add warning toast', () => {
    toast.warning('Warning message');

    const state = toast.getState();
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].type).toBe('warning');
  });

  it('should add info toast', () => {
    toast.info('Info message');

    const state = toast.getState();
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].type).toBe('info');
  });

  it('should remove toast by id', () => {
    const id = toast.show('Test message', 'info');

    let state = toast.getState();
    expect(state.toasts).toHaveLength(1);

    toast.remove(id);

    state = toast.getState();
    expect(state.toasts).toHaveLength(0);
  });

  it('should handle multiple toasts', () => {
    toast.show('Message 1', 'info');
    toast.show('Message 2', 'success');
    toast.show('Message 3', 'error');

    const state = toast.getState();
    expect(state.toasts).toHaveLength(3);
  });

  it('should subscribe and notify listeners', () => {
    const listener = vi.fn();
    const unsubscribe = toast.subscribe(listener);

    toast.show('Test message', 'info');

    expect(listener).toHaveBeenCalled();

    unsubscribe();
  });
});
