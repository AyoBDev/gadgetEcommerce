'use client';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useStore } from '@/components/StoreProvider';

export function ProductDetailActions({ laptopId }: { laptopId: number }) {
  const { isInWishlist, toggleWishlist, isInCompare, toggleCompare, compare, compareMax } = useStore();
  const inWishlist = isInWishlist(laptopId);
  const inCompare = isInCompare(laptopId);
  const compareFull = !inCompare && compare.length >= compareMax;

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <Button
        variant="outlined"
        fullWidth
        startIcon={inWishlist ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        onClick={() => toggleWishlist(laptopId)}
        color={inWishlist ? 'error' : 'primary'}
      >
        {inWishlist ? 'In wishlist' : 'Add to wishlist'}
      </Button>
      <Button
        variant="outlined"
        fullWidth
        startIcon={<CompareArrowsIcon />}
        onClick={() => toggleCompare(laptopId)}
        disabled={compareFull}
      >
        {inCompare ? 'In compare' : compareFull ? 'Compare full' : 'Add to compare'}
      </Button>
    </Stack>
  );
}
