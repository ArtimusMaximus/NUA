export async function loadingDialogTimer(dialogRef) {
    await new Promise(res => setTimeout((res) => {
        dialogRef.current.close();
    }, 400));
}