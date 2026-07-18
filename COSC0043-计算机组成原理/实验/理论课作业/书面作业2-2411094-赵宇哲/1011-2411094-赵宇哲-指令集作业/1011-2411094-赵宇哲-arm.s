.syntax unified
.arm

.global _start

.section .text

_start:
    ldr r0, =data      @ r0 保存数组首地址
    mov r1, #8         @ r1 保存数组长度
    mov r2, #10        @ r2 保存阈值 threshold = 10
    mov r4, #0         @ r4 保存 count
    mov r5, #0         @ r5 保存 sum

loop:
    cmp r1, #0         @ 判断是否处理完所有数据
    beq done

    ldr r3, [r0], #4   @ 读取当前数据，并让数组地址后移 4 字节

    cmp r3, r2         @ 比较当前数据和阈值
    addge r4, r4, #1   @ 如果 r3 >= r2，则 count++
    addge r5, r5, r3   @ 如果 r3 >= r2，则 sum += r3

    subs r1, r1, #1    @ 剩余数据个数减 1
    b loop             @ 继续循环

done:
    mov r0, r5         @ 将 sum 作为程序退出码
    mov r7, #1         @ ARM Linux 的 exit 系统调用号
    svc #0             @ 发起系统调用，退出程序

.section .data
.align 2

data:
    .word 8, 12, 6, 20, 15, 9, 3, 11
