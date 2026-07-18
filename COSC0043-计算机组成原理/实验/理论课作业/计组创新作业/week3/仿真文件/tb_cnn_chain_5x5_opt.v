`timescale 1ns/1ps

module tb_cnn_chain_5x5_opt;

reg [7:0] p00, p01, p02, p03, p04;
reg [7:0] p10, p11, p12, p13, p14;
reg [7:0] p20, p21, p22, p23, p24;
reg [7:0] p30, p31, p32, p33, p34;
reg [7:0] p40, p41, p42, p43, p44;

reg [7:0] k00, k01, k02;
reg [7:0] k10, k11, k12;
reg [7:0] k20, k21, k22;

wire [7:0] y00, y01, y10, y11;

cnn_chain_5x5_opt uut (
    .p00(p00), .p01(p01), .p02(p02), .p03(p03), .p04(p04),
    .p10(p10), .p11(p11), .p12(p12), .p13(p13), .p14(p14),
    .p20(p20), .p21(p21), .p22(p22), .p23(p23), .p24(p24),
    .p30(p30), .p31(p31), .p32(p32), .p33(p33), .p34(p34),
    .p40(p40), .p41(p41), .p42(p42), .p43(p43), .p44(p44),

    .k00(k00), .k01(k01), .k02(k02),
    .k10(k10), .k11(k11), .k12(k12),
    .k20(k20), .k21(k21), .k22(k22),

    .y00(y00), .y01(y01),
    .y10(y10), .y11(y11)
);

initial begin
    // 5x5 input matrix
    p00 = 8'd1;  p01 = 8'd2;  p02 = 8'd3;  p03 = 8'd4;  p04 = 8'd5;
    p10 = 8'd6;  p11 = 8'd7;  p12 = 8'd8;  p13 = 8'd9;  p14 = 8'd10;
    p20 = 8'd11; p21 = 8'd12; p22 = 8'd13; p23 = 8'd14; p24 = 8'd15;
    p30 = 8'd16; p31 = 8'd17; p32 = 8'd18; p33 = 8'd19; p34 = 8'd20;
    p40 = 8'd21; p41 = 8'd22; p42 = 8'd23; p43 = 8'd24; p44 = 8'd25;

    // ¹Ì¶¨¾í»ýºË
    k00 = 8'd0; k01 = 8'd1; k02 = 8'd0;
    k10 = 8'd1; k11 = 8'd2; k12 = 8'd1;
    k20 = 8'd0; k21 = 8'd1; k22 = 8'd0;

    #10;

    $display("Optimized convolution output:");
    $display("%0d %0d %0d", uut.conv00, uut.conv01, uut.conv02);
    $display("%0d %0d %0d", uut.conv10, uut.conv11, uut.conv12);
    $display("%0d %0d %0d", uut.conv20, uut.conv21, uut.conv22);

    $display("Optimized pooling output:");
    $display("%0d %0d", y00, y01);
    $display("%0d %0d", y10, y11);

    #10;
    $finish;
end

endmodule