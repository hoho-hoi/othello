import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the app title', () => {
    render(<App />)
    expect(screen.getByText('Othello')).toBeInTheDocument()
  })

  it('renders setup complete message', () => {
    render(<App />)
    expect(
      screen.getByText('Setup complete. Ready for development.')
    ).toBeInTheDocument()
  })
})
