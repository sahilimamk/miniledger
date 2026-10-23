import type { NavKey } from '../components/NavRail';
import type { MainStackParamList } from '../navigation/types';

/** The slice of the stack navigation object the rail needs. */
interface NavLike {
  navigate: (name: keyof MainStackParamList) => void;
}

/**
 * Shared rail wiring for the main screens. Overview, Loans and Add Loan are
 * real stack routes; every screen builds its `nav` prop from here so the
 * rail behaves identically everywhere. (Before v11 each screen hand-rolled
 * this and most keys were dead ends — Overview didn't exist as a route at
 * all, so it rendered the Loans screen.)
 */
export function mainNav(navigation: NavLike, active: NavKey) {
  return {
    active,
    onNavigate: (key: NavKey) => {
      if (key === 'overview') navigation.navigate('Overview');
      else if (key === 'loans') navigation.navigate('Loans');
      else navigation.navigate('AddLoan');
    },
  };
}
