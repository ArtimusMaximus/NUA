


export default function DeviceCardSkeleton({ devices, loading })
{
    const skeletons = () => {
        let arr=[];
        let length = 12;
        while(length > 0) {
            arr.push('NUA')
            length -= 1;
        }
        return arr;
    }
    const skelArray = skeletons();



    return (
        <>
        {
            skelArray.map((str, index) => {
                return (
                    <>
                        <div className={`${loading ? 'skeleton w-96 h-96' : ''} grid-flow-row flex items-center justify-center mx-auto text-4xl`}>{!devices && !loading && 'There is not data to display...'}<div className="flex flex-col items-center justify-center gap-2"><span className="loading loading-spinner w-12 h-12"></span>{str}</div></div>
                    </>
                )
            })
        }
        </>
    )
}