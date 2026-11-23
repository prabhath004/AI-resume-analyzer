import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Upload from './Upload';

jest.mock('axios', () => ({ post: jest.fn() }));

describe('Upload', () => {
  it('presents an accessible resume upload flow and advances after selection', async () => {
    render(<Upload />);

    expect(
      screen.getByRole('heading', { level: 1, name: /resume analysis/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/pdf, doc, or docx/i)).toBeInTheDocument();

    const fileInput = screen.getByLabelText(/choose resume file/i);
    expect(fileInput).toHaveAttribute('accept', '.pdf,.doc,.docx');

    await userEvent.upload(
      fileInput,
      new File(['resume'], 'candidate.pdf', { type: 'application/pdf' })
    );

    expect(
      screen.getByRole('textbox', { name: /job description/i })
    ).toBeInTheDocument();
    expect(screen.getByText('candidate.pdf')).toBeInTheDocument();
  });
});
