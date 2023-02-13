type RevalidatePath = (path: string) => void
export const revalidatePath: RevalidatePath = async (path) => {
  try {
    const res = await fetch(`${process.env.PAYLOAD_PUBLIC_SITE_URL}/api/revalidate?secret=${process.env.NEXT_PRIVATE_REVALIDATION_KEY}&revalidatePath=${path}`);

    if (res.ok) {
      // eslint-disable-next-line no-console
      console.log(`Revalidated path ${path}`);
    } else {
      console.error(`Error revalidating path ${path}`);
    }
  } catch (err) {
    console.error(`Error hitting revalidate route for ${path}`);
  }
};
