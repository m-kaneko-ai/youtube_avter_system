import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Edit, Trash } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem } from './DropdownMenu';

// Mock useThemeStore
vi.mock('../../stores/themeStore', () => ({
  useThemeStore: () => ({
    mode: 'light',
  }),
}));

describe('DropdownMenu', () => {
  const mockItems: DropdownMenuItem[] = [
    {
      id: 'edit',
      label: 'Edit',
      icon: <Edit size={16} />,
      onClick: vi.fn(),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash size={16} />,
      onClick: vi.fn(),
      variant: 'danger',
    },
  ];

  beforeEach(() => {
    mockItems.forEach(() => vi.clearAllMocks());
  });

  it('should render trigger button', () => {
    render(<DropdownMenu items={mockItems} />);

    const triggerButton = screen.getByRole('button');
    expect(triggerButton).toBeInTheDocument();
  });

  it('should not show menu initially', () => {
    render(<DropdownMenu items={mockItems} />);

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('should show menu when trigger is clicked', () => {
    render(<DropdownMenu items={mockItems} />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should hide menu when trigger is clicked again', () => {
    render(<DropdownMenu items={mockItems} />);

    const triggerButton = screen.getByRole('button');

    // Open menu
    fireEvent.click(triggerButton);
    expect(screen.getByText('Edit')).toBeInTheDocument();

    // Close menu
    fireEvent.click(triggerButton);
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('should call onClick when menu item is clicked', () => {
    render(<DropdownMenu items={mockItems} />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(mockItems[0].onClick).toHaveBeenCalledTimes(1);
  });

  it('should close menu after item is clicked', () => {
    render(<DropdownMenu items={mockItems} />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('should not call onClick when disabled item is clicked', () => {
    const disabledItems: DropdownMenuItem[] = [
      {
        id: 'disabled',
        label: 'Disabled',
        onClick: vi.fn(),
        disabled: true,
      },
    ];

    render(<DropdownMenu items={disabledItems} />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    const disabledButton = screen.getByText('Disabled');
    fireEvent.click(disabledButton);

    expect(disabledItems[0].onClick).not.toHaveBeenCalled();
  });

  it('should render horizontal trigger by default', () => {
    const { container } = render(<DropdownMenu items={mockItems} />);

    // Check for MoreHorizontal icon
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render vertical trigger when specified', () => {
    const { container } = render(<DropdownMenu items={mockItems} trigger="vertical" />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should apply danger variant styling', () => {
    render(<DropdownMenu items={mockItems} />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    const deleteButton = screen.getByText('Delete');
    expect(deleteButton).toHaveClass('text-red-600');
  });

  it('should close menu when clicking outside', () => {
    render(
      <div>
        <DropdownMenu items={mockItems} />
        <div data-testid="outside">Outside</div>
      </div>
    );

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    expect(screen.getByText('Edit')).toBeInTheDocument();

    const outside = screen.getByTestId('outside');
    fireEvent.mouseDown(outside);

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('should align menu to right by default', () => {
    render(<DropdownMenu items={mockItems} />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    const menu = screen.getByText('Edit').closest('div');
    expect(menu).toHaveClass('right-0');
  });

  it('should align menu to left when specified', () => {
    render(<DropdownMenu items={mockItems} align="left" />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    const menu = screen.getByText('Edit').closest('div');
    expect(menu).toHaveClass('left-0');
  });
});
