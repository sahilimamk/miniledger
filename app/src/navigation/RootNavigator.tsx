import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../auth/AuthContext';
import { LoadingView } from '../components/LoadingView';
import { AddLoanScreen } from '../screens/AddLoanScreen';
import { LoanDetailScreen } from '../screens/LoanDetailScreen';
import { LoansScreen } from '../screens/LoansScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OverviewScreen } from '../screens/OverviewScreen';
import { OtpScreen } from '../screens/OtpScreen';
import { useTheme } from '../theme/useTheme';
import type { AuthStackParamList, MainStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

/** Shows the auth flow when signed out and the ledger when signed in. */
export function RootNavigator() {
  const { token, restoring } = useAuth();
  const { colors } = useTheme();

  if (restoring) {
    return <LoadingView message="Loading your ledger…" />;
  }

  const headerOptions = {
    headerStyle: {
      backgroundColor: colors.systemGroupedBackground,
    },
    headerTitleStyle: {
      color: colors.label,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 17,
    },
    headerTintColor: colors.tint,
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.systemGroupedBackground },
  } as const;

  return (
    <NavigationContainer>
      {token ? (
        <MainStack.Navigator screenOptions={headerOptions}>
          <MainStack.Screen
            name="Overview"
            component={OverviewScreen}
            options={{ title: 'MiniLedger', headerLargeTitle: true }}
          />
          <MainStack.Screen
            name="Loans"
            component={LoansScreen}
            options={{ title: 'Loans', headerLargeTitle: true }}
          />
          <MainStack.Screen
            name="AddLoan"
            component={AddLoanScreen}
            options={{ title: 'Add Loan' }}
          />
          <MainStack.Screen
            name="LoanDetail"
            component={LoanDetailScreen}
            options={{ title: 'Loan Details' }}
          />
        </MainStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={headerOptions}>
          <AuthStack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <AuthStack.Screen
            name="Otp"
            component={OtpScreen}
            options={{ headerShown: false }}
          />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
