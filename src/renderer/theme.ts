import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7fcfff'
    },
    secondary: {
      main: '#b69cff'
    },
    background: {
      default: '#111318',
      paper: '#171b22'
    }
  },
  shape: {
    borderRadius: 24
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 28,
          backgroundImage: 'none'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    },
    MuiButton: {
      defaultProps: {
        variant: 'contained'
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 16
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 18
        }
      }
    }
  }
});
