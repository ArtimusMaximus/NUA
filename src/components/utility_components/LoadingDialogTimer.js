export function loadingDialogTimer(dialogRef) {
    setTimeout(() => {
        dialogRef.current.close();
    }, 400);
}