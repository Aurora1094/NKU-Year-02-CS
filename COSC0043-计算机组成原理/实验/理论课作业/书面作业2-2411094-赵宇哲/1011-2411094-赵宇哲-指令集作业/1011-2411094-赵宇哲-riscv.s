.option norvc

.global _start

.section .text

_start:
    la t0, data        # t0 保存数组首地址
    li t1, 8           # t1 保存数组长度
    li t2, 10          # t2 保存阈值 threshold = 10
    li t4, 0           # t4 保存 count
    li t5, 0           # t5 保存 sum

loop:
    beqz t1, done      # 如果数据处理完，跳转到 done

    lw t3, 0(t0)       # 读取当前数据
    addi t0, t0, 4     # 数组地址后移 4 字节

    blt t3, t2, skip   # 如果 t3 < threshold，则跳过统计
    addi t4, t4, 1     # count++
    add t5, t5, t3     # sum += 当前数据

skip:
    addi t1, t1, -1    # 剩余数据个数减 1
    j loop             # 继续循环

done:
    mv a0, t5          # 将 sum 作为程序退出码
    li a7, 93          # RISC-V Linux 的 exit 系统调用号
    ecall              # 发起系统调用，退出程序

.section .data
.align 2

data:
    .word 8, 12, 6, 20, 15, 9, 3, 11
